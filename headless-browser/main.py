from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime

app = FastAPI(title="Facebook Post Scraper API")

class FacebookCredentials(BaseModel):
    email: str
    password: str
    post_url: str

class Comment(BaseModel):
    author: str
    comment: str
    timestamp: str
    reactions: int = 0
    isReply: bool = False

class PostData(BaseModel):
    author: str
    post_content: str
    post_time: str
    post_url: str
    comments: List[dict]
    scraped_at: str

class FacebookScraper:
    def __init__(self):
        self.browser = None
        self.page = None
        self.context = None
        self.playwright = None

    async def initialize(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            args=[
                '--disable-notifications',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        self.page = await self.context.new_page()

    async def login(self, email: str, password: str):
        try:
            await self.page.goto('https://www.facebook.com/', timeout=30000)
            
            # Accept cookies if present
            try:
                cookie_button = await self.page.query_selector('button[data-cookiebanner="accept_button"]')
                if cookie_button:
                    await cookie_button.click()
                    await asyncio.sleep(2)
            except Exception:
                print('No cookie banner found')

            # Login
            await self.page.fill('#email', email)
            await self.page.fill('#pass', password)
            
            # Click login button
            await self.page.click('button[name="login"]')
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(5)

            # Check login success
            if 'checkpoint' in self.page.url or 'login' in self.page.url:
                raise Exception('Login failed - Please check credentials or handle 2FA')

        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

    async def expand_all_comments(self):
        try:
            for _ in range(10):  # Try expanding 10 times maximum
                try:
                    # Click "View more comments" buttons
                    more_buttons = await self.page.query_selector_all('div[role="button"]')
                    clicked = False
                    
                    for button in more_buttons:
                        try:
                            text = await button.text_content()
                            if text and ('view more comments' in text.lower() or 
                                       'previous comments' in text.lower()):
                                await button.click()
                                clicked = True
                                await asyncio.sleep(2)
                        except:
                            continue
                    
                    if not clicked:
                        break
                        
                except Exception as e:
                    print(f"Error expanding comments: {e}")
                    break
                    
                await asyncio.sleep(2)
        except Exception as e:
            print(f"Error in expand_all_comments: {e}")

    async def scrape_post(self, post_url: str) -> dict:
        try:
            await self.page.goto(post_url, timeout=30000)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(5)

            # Get post content
            post_data = await self.page.evaluate('''() => {
                const postTexts = Array.from(document.querySelectorAll('div[dir="auto"]'))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0);

                const postContent = postTexts.reduce((longest, current) => 
                    current.length > longest.length ? current : longest, '');

                const authorElement = document.querySelector('h2 a') || 
                                    document.querySelector('strong a') ||
                                    document.querySelector('a[role="link"]');

                const timestampElement = Array.from(document.querySelectorAll('a[role="link"] span'))
                    .find(span => {
                        const text = span.textContent.toLowerCase();
                        return text.includes('h') || text.includes('m') || text.includes('d');
                    });

                return {
                    author: authorElement ? authorElement.textContent.trim() : 'Unknown',
                    post_content: postContent,
                    post_time: timestampElement ? timestampElement.textContent.trim() : '',
                    post_url: window.location.href
                };
            }''')

            # Expand and get comments
            await self.expand_all_comments()
            
            comments = await self.page.evaluate('''() => {
                const comments = [];
                const commentElements = Array.from(document.querySelectorAll('div[role="article"]'));
                
                commentElements.forEach(comment => {
                    try {
                        const contentElement = comment.querySelector('div[dir="auto"]:not([style*="display: none"])');
                        if (!contentElement) return;

                        const content = contentElement.textContent.trim();
                        if (!content) return;

                        const authorElement = comment.querySelector('a[role="link"]:not([href*="reaction"])');
                        const timestampElement = comment.querySelector('a[role="link"] span[dir="auto"]');
                        
                        comments.push({
                            'author': authorElement ? authorElement.textContent.trim() : 'Unknown',
                            'comment': content,
                            'time': timestampElement ? timestampElement.textContent.trim() : '',
                            'reactions': 0,
                            'is_reply': !!comment.closest('div[role="article"] div[role="article"]')
                        });
                    } catch (e) {
                        console.error('Error processing comment:', e);
                    }
                });

                return comments;
            }''')

            formatted_data = {
                'post': {
                    'author': post_data['author'],
                    'content': post_data['post_content'],
                    'time': post_data['post_time'],
                    'url': post_data['post_url']
                },
                'comments': comments,
                'metadata': {
                    'total_comments': len(comments),
                    'scraped_at': datetime.now().isoformat()
                }
            }

            return formatted_data

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")

    async def close(self):
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

@app.post("/scrape-post")
async def scrape_facebook_post(credentials: FacebookCredentials):
    scraper = FacebookScraper()
    try:
        await scraper.initialize()
        await scraper.login(credentials.email, credentials.password)
        post_data = await scraper.scrape_post(credentials.post_url)
        return post_data
    finally:
        await scraper.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 