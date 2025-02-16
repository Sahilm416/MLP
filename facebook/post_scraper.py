import logging
import asyncio
from datetime import datetime
from typing import Dict

from fastapi import HTTPException
from playwright.async_api import async_playwright, TimeoutError
from modal import App, Image, web_endpoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("post_scraper")

playwright_image = (
    Image.debian_slim()
    .pip_install("playwright")
    .run_commands("playwright install-deps", "playwright install")
)

app = App(name="Headless", image=playwright_image)

@app.function(keep_warm=0)
@web_endpoint(label="scrape-facebook-post", method="POST")
async def get_facebook_post(credentials: Dict):
    post_url = credentials.get("post_url")
    if not post_url:
        logger.error("Missing required field: post_url")
        return {"error": "Missing required field: post_url"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        async def handle_dialog(dialog):
            logger.info(f"Dismissing dialog: {dialog.message}")
            await dialog.dismiss()
        page.on("dialog", handle_dialog)

        try:
            logger.info(f"Navigating to post URL: {post_url}")
            await page.goto(post_url, timeout=60000)
            await page.wait_for_load_state("networkidle", timeout=60000)
            await asyncio.sleep(5)  # Increased initial wait time

            if "login" in page.url:
                logger.warning("Redirected to login page, navigating back")
                await page.goBack()
                await page.wait_for_load_state("networkidle", timeout=60000)
                await asyncio.sleep(5)

            await page.wait_for_selector('div[data-ad-rendering-role="story_message"]', timeout=60000)
            await asyncio.sleep(3)
            
            # Extract post content
            post_data = await page.evaluate('''() => {
                const postElement = document.querySelector('div[data-ad-rendering-role="story_message"]');
                return {
                    post_content: postElement ? postElement.innerText.trim() : "",
                    post_url: window.location.href,
                    post_image_alt: Array.from(document.querySelectorAll('img[alt]'))
                        .map(img => img.alt)
                        .filter(alt => alt && alt.length > 10)
                        .join(", ")
                };
            }''')

            comments = []
            previous_count = 0
            no_new_comments_counter = 0
            max_attempts = 50

            while no_new_comments_counter < max_attempts:
                # Click any "View more comments" or "See more" buttons first
                for button_text in ["View more comments", "See more", "View previous comments", "View more replies"]:
                    try:
                        buttons = await page.query_selector_all(f'div[role="button"]:text-matches("{button_text}", "i")')
                        for button in buttons:
                            await button.click()
                            await asyncio.sleep(3)  # Increased delay after button clicks
                    except Exception as e:
                        logger.info(f"Button click attempt for '{button_text}': {e}")

                # Scroll the comments section using the specific scrollbar element
                scroll_result = await page.evaluate('''() => {
                    const scrollbar = document.querySelector('div.x14nfmen.x1s85apg.x5yr21d.xds687c.xg01cxk.x10l6tqk.x13vifvy.x1wsgiic.x19991ni.xwji4o3.x1kky2od.x1sd63oq');
                    if (scrollbar) {
                        const parent = scrollbar.parentElement;
                        if (parent) {
                            const currentScroll = parent.scrollTop;
                            parent.scrollTop = parent.scrollHeight;
                            return {
                                scrolled: currentScroll !== parent.scrollTop,
                                currentScroll: parent.scrollTop,
                                maxScroll: parent.scrollHeight
                            };
                        }
                    }
                    return null;
                }''')
                
                if scroll_result:
                    logger.info(f"Scroll position: {scroll_result}")
                    # Increased delay after scrolling to ensure content loads
                    await asyncio.sleep(5)
                    
                    # Wait for network activity to settle - Fixed the catch syntax
                    try:
                        await page.wait_for_load_state("networkidle", timeout=10000)
                    except TimeoutError:
                        logger.info("Network idle timeout reached")
                    await asyncio.sleep(2)

                # Rest of the code remains the same...
                new_comments = await page.evaluate('''() => {
                    const comments = [];
                    const seen = new Set();
                    
                    const containers = document.querySelectorAll('div[role="article"]');
                    
                    containers.forEach(container => {
                        if (container.closest('div[data-ad-rendering-role="story_message"]')) return;
                        
                        const textSelectors = [
                            'div[dir="auto"][style*="text-align: start"]',
                            'div[data-ad-comet-preview="message"]',
                            'div[data-ad-preview="message"]',
                            'div.xdj266r',
                            'div[style*="text-align: start"]'
                        ];
                        
                        let commentText = '';
                        for (const selector of textSelectors) {
                            const element = container.querySelector(selector);
                            if (element && element.textContent.trim()) {
                                commentText = element.textContent.trim();
                                break;
                            }
                        }
                        
                        if (!commentText || seen.has(commentText)) return;
                        seen.add(commentText);
                        
                        const authorElement = container.querySelector('a[role="link"]:not([href*="reaction"]):not([href*="photo"])');
                        const timestampElement = container.querySelector('a[role="link"][href*="comment"]');
                        
                        comments.push({
                            'comment': commentText,
                            'author': authorElement ? authorElement.textContent.trim() : '',
                            'timestamp': timestampElement ? timestampElement.textContent.trim() : ''
                        });
                    });
                    
                    return comments;
                }''')

                existing_comments = {(c['comment'], c.get('author', '')) for c in comments}
                filtered_comments = [
                    c for c in new_comments 
                    if (c['comment'], c.get('author', '')) not in existing_comments
                ]

                comments.extend(filtered_comments)
                
                logger.info(f"Total comments found: {len(comments)} (New in this iteration: {len(filtered_comments)})")
                
                if len(comments) == previous_count:
                    no_new_comments_counter += 1
                    if not scroll_result or not scroll_result.get('scrolled'):
                        logger.info("No more scrolling possible")
                        await asyncio.sleep(5)
                        break
                else:
                    no_new_comments_counter = 0
                    
                previous_count = len(comments)
                await asyncio.sleep(3)

            formatted_data = {
                "post": {
                    "content": post_data["post_content"],
                    "url": post_data["post_url"],
                    "image_alt": post_data["post_image_alt"],
                },
                "comments": comments,
                "metadata": {
                    "total_comments": len(comments),
                    "scraped_at": datetime.now().isoformat(),
                },
            }

            logger.info("Scraping complete, closing browser")
            await browser.close()
            return formatted_data

        except Exception as e:
            logger.error(f"Error during scraping: {e}")
            await browser.close()
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")