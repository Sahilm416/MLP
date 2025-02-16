from modal import App, Image, web_endpoint
import modal
import os
from typing import Dict
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from fastapi import HTTPException

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

@app.function(secrets=[modal.Secret.from_name("Mega_Project")])
@web_endpoint(label="scrape-facebook-post", method="POST")
async def get_facebook_comments(credentials: Dict):
    email = os.environ["email"]
    password = os.environ["password"]
    post_url = credentials.get("post_url")
    
    if not email or not password or not post_url:
        return {"error": "Missing required fields (email, password, post_url)"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Step 1: Login to Facebook
            await page.goto('https://www.facebook.com/', timeout=30000)
            try:
                cookie_button = await page.query_selector('button[data-cookiebanner="accept_button"]')
                if cookie_button:
                    await cookie_button.click()
                    await asyncio.sleep(1)
            except Exception:
                pass

            await page.fill('#email', email)
            await page.fill('#pass', password)
            await page.click('button[name="login"]')
            print("Login is successful")
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)

            if 'checkpoint' in page.url or 'login' in page.url:
                raise Exception('Login failed - Please check credentials or handle 2FA')

            # Step 2: Navigate to the post and scrape content
            await page.goto(post_url, timeout=30000)
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)

            # Extract post content
            post_data = await page.evaluate('''() => {
                const postTexts = Array.from(document.querySelectorAll('div[dir="auto"]'))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0);

                const postContent = postTexts.reduce((longest, current) => 
                    current.length > longest.length ? current : longest, '');

                return {
                    post_content: postContent,
                    post_url: window.location.href
                };
            }''') 
            
            # Step 3: Scrape unique comments and count duplicates
            unique_comments = set()
            comments=[]
            total_comments = 0
            duplicate_comments = 0
            max_comments = 100

            while len(unique_comments) < max_comments:
                more_buttons = await page.query_selector_all('div[role="button"]')
                clicked = False

                for button in more_buttons:
                    try:
                        text = await button.text_content()
                        if text and ('view more comments' in text.lower() or 
                                     'previous comments' in text.lower()):
                            await button.click()
                            clicked = True
                            await asyncio.sleep(2)
                    except Exception:
                        continue
                
                if not clicked:
                    break

                new_comments = await page.evaluate('''() => {
                    const comments = [];
                    const commentElements = Array.from(document.querySelectorAll('div[role="article"]'));

                    commentElements.forEach(comment => {
                        try {
                            const contentElement = comment.querySelector('div[dir="auto"]:not([style*="display: none"])');
                            if (!contentElement) return;

                            const content = contentElement.textContent.trim();
                            if (content) {
                                comments.push(content);
                            }
                        } catch (e) {
                            console.error('Error processing comment:', e);
                        }
                    });

                    return comments;
                }''')

                for comment in new_comments:
                    total_comments += 1  # Count all comments
                    if comment in unique_comments:
                        duplicate_comments += 1  # Count duplicates
                    else:
                        unique_comments.add(comment)
                        comments.append({"comment": comment})

                if len(unique_comments) >= max_comments:
                    break
                
            # Step 4: Format output
            formatted_data = {
                'post': {
                    'content': post_data['post_content'],
                    'url': post_data['post_url']
                },
                'comments': comments[:max_comments],
                'metadata': {
                    'total_comments': total_comments,
                    'total_unique_comments': len(unique_comments),
                    'duplicate_comments': duplicate_comments,
                    'scraped_at': datetime.now().isoformat(),
                    'comment_limit_reached': len(unique_comments) >= max_comments
                }
            }

            await browser.close()
            return formatted_data

        except Exception as e:
            await browser.close()
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")
