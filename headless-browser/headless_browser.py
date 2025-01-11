from modal import App, Image, Mount, web_endpoint
from typing import Dict
import pickle
import re
from fastapi import HTTPException
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright


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
    # Extract login credentials and the post URL from the input
    email = credentials.get("email")
    password = credentials.get("password")
    post_url = credentials.get("post_url")
    
    # Check if all required fields are provided
    if not email or not password or not post_url:
        return {"error": "Missing required fields (email, password, post_url)"}

    # Start the browser session
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Step 1: Login to Facebook
            await page.goto('https://www.facebook.com/', timeout=30000)
            
            # Accept cookies if present
            try:
                cookie_button = await page.query_selector('button[data-cookiebanner="accept_button"]')
                if cookie_button:
                    await cookie_button.click()
                    await asyncio.sleep(1)
            except Exception:
                print('No cookie banner found')

            # Login
            await page.fill('#email', email)
            await page.fill('#pass', password)
            
            # Click login button
            await page.click('button[name="login"]')
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)

            # Check login success
            if 'checkpoint' in page.url or 'login' in page.url:
                raise Exception('Login failed - Please check credentials or handle 2FA')

            # Step 2: Scrape the post and comments
            await page.goto(post_url, timeout=30000)
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)

            # Get post content
            post_data = await page.evaluate('''() => {
                const postTexts = Array.from(document.querySelectorAll('div[dir="auto"]'))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0);

                const postContent = postTexts.reduce((longest, current) => 
                    current.length > longest.length ? current : longest, '')

                return {
                    post_content: postContent,
                    post_url: window.location.href
                };
            }''')

            # Step 3: Expand some comments (limit to 100 comments)
            comment_count = 0
            while comment_count < 100:
                more_buttons = await page.query_selector_all('div[role="button"]')
                clicked = False
                
                for button in more_buttons:
                    try:
                        text = await button.text_content()
                        if text and ('view more comments' in text.lower() or 
                                   'previous comments' in text.lower()):
                            await button.click()
                            clicked = True
                            await asyncio.sleep(2)  # Pause to allow the page to load more comments
                    except:
                        continue
                
                if not clicked:
                    break  # If no buttons were clicked, we stop

                # Wait for the page to load new comments
                await page.wait_for_load_state('networkidle')
                await asyncio.sleep(2)

                # Get the number of comments loaded so far
                comment_count = await page.evaluate('''() => {
                    const commentElements = document.querySelectorAll('div[role="article"]');
                    return commentElements.length;
                }''')

            # Step 4: Scrape the comments (limit to 100)
            comments = await page.evaluate('''() => {
                const comments = [];
                const commentElements = Array.from(document.querySelectorAll('div[role="article"]')).slice(0, 100);
                
                commentElements.forEach(comment => {
                    try {
                        const contentElement = comment.querySelector('div[dir="auto"]:not([style*="display: none"])');
                        if (!contentElement) return;

                        const content = contentElement.textContent.trim();
                        if (!content) return;

                        comments.push({
                            'comment': content,
                        });
                    } catch (e) {
                        console.error('Error processing comment:', e);
                    }
                });

                return comments;
            }''')

            formatted_data = {
                'post': {
                    'content': post_data['post_content'],
                    'url': post_data['post_url']
                },
                'comments': comments,
                'metadata': {
                    'total_comments': len(comments),
                    'scraped_at': datetime.now().isoformat()
                }
            }

            # Close the browser
            await browser.close()

            return formatted_data

        except Exception as e:
            await browser.close()
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")
