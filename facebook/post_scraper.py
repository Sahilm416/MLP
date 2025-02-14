import logging
from modal import App, Image, Mount, web_endpoint
from typing import Dict
from fastapi import HTTPException
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("post_scraper")

# Build an image with the required dependencies
playwright_image = Image.debian_slim(python_version="3.11").run_commands(
    "apt-get update",
    "apt-get install -y software-properties-common",
    "apt-add-repository non-free",
    "apt-add-repository contrib",
    "pip install playwright==1.42.0",
    "playwright install-deps chromium",
    "playwright install chromium",
)

app = App(name="Headless", image=playwright_image)

@app.function(keep_warm=0)
@web_endpoint(label="scrape-facebook-post", method="POST")
async def get_facebook_comments(credentials: Dict):
    email = credentials.get("email")
    password = credentials.get("password")
    post_url = credentials.get("post_url")
    
    if not email or not password or not post_url:
        logger.error("Missing required fields (email, password, post_url)")
        return {"error": "Missing required fields (email, password, post_url)"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            logger.info("Navigating to Facebook login page")
            await page.goto('https://www.facebook.com/', timeout=60000)
            try:
                cookie_button = await page.query_selector('button[data-cookiebanner="accept_button"]')
                if cookie_button:
                    logger.info("Cookie banner found, clicking accept")
                    await cookie_button.click()
                    await asyncio.sleep(1)
            except Exception as e:
                logger.warning(f"Cookie banner not handled: {e}")

            logger.info("Filling login credentials")
            await page.fill('#email', email)
            await page.fill('#pass', password)
            await page.click('button[name="login"]')
            await page.wait_for_load_state('networkidle', timeout=60000)
            await asyncio.sleep(2)

            logger.info(f"Current URL after login: {page.url}")
            if 'checkpoint' in page.url or 'login' in page.url:
                logger.error("Login failed; checkpoint encountered")
                raise Exception('Login failed - Please check credentials or handle 2FA')
            else:
                logger.info("Login successful")

            logger.info(f"Navigating to post URL: {post_url}")
            await page.goto(post_url, timeout=60000)
            await page.wait_for_load_state('networkidle', timeout=60000)
            await page.wait_for_selector('div[data-ad-rendering-role="story_message"]', timeout=60000)
            await asyncio.sleep(2)

            logger.info("Extracting post content and image alt text")
            post_data = await page.evaluate('''() => {
                let postContent = "";
                let postImageAlt = "";
                const postElement = document.querySelector('div[data-ad-rendering-role="story_message"]');
                if (postElement) {
                    postContent = postElement.innerText.trim();
                    // Gather alt text from all images inside the post element
                    const images = postElement.querySelectorAll('img[alt]');
                    if (images.length > 0) {
                        postImageAlt = Array.from(images).map(img => img.alt).join(", ");
                    }
                }
                return {
                    post_content: postContent,
                    post_url: window.location.href,
                    post_image_alt: postImageAlt
                };
            }''')
            logger.info(f"Post content (first 50 chars): {post_data['post_content'][:50]}...")
            logger.info(f"Post image alt text: {post_data['post_image_alt']}")

            # Step 3: Scrape comments (limit: 50)
            comments = []
            total_count = 0
            max_comments = 50

            while total_count < max_comments:
                logger.info("Scrolling to bottom to trigger dynamic loading")
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await asyncio.sleep(2)

                # Click "view more comments" or similar buttons if available
                more_buttons = await page.query_selector_all('div[role="button"]')
                clicked = False
                for button in more_buttons:
                    try:
                        text = await button.text_content()
                        if text and ('view more comments' in text.lower() or 'previous comments' in text.lower()):
                            logger.info("Clicking a 'view more comments' button")
                            await button.click()
                            clicked = True
                            await asyncio.sleep(2)
                    except Exception as e:
                        logger.warning(f"Error clicking a button: {e}")
                        continue

                logger.info("Extracting comments from rendered HTML")
                new_comments = await page.evaluate('''() => {
                    const comments = [];
                    const containers = document.querySelectorAll('div[role="article"]');
                    containers.forEach(container => {
                        if(container.closest('div[data-ad-rendering-role="story_message"]')) return;
                        const textElement = container.querySelector('div[dir="auto"][style*="text-align: start"]');
                        if(textElement) {
                            const commentText = textElement.innerText.trim();
                            if(commentText) {
                                comments.push({ 'comment': commentText });
                            }
                        }
                    });
                    return comments;
                }''')
                logger.info(f"Found {len(new_comments)} new comments")
                existing_comments = set(c['comment'] for c in comments)
                filtered_new_comments = [c for c in new_comments if c['comment'] not in existing_comments]
                logger.info(f"Filtered to {len(filtered_new_comments)} unique new comments")
                total_count += len(filtered_new_comments)
                comments.extend(filtered_new_comments)

                if not clicked or len(filtered_new_comments) == 0:
                    logger.info("No more new comments loaded; breaking out of loop")
                    break

            logger.info(f"Total comments collected: {len(comments)}")

            # Step 4: Format and return output
            formatted_data = {
                'post': {
                    'content': post_data['post_content'],
                    'url': post_data['post_url'],
                    'image_alt': post_data['post_image_alt']
                },
                'comments': comments[:max_comments],
                'metadata': {
                    'total_comments': total_count,
                    'scraped_at': datetime.now().isoformat(),
                    'comment_limit_reached': len(comments) >= max_comments
                }
            }

            logger.info("Scraping complete, closing browser")
            await browser.close()
            return formatted_data

        except Exception as e:
            logger.error(f"Error during scraping: {e}")
            await browser.close()
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")
