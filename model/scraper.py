from fastapi import FastAPI, HTTPException, Body
from typing import Dict
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
import uvicorn
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Facebook Post Scraper API",
    description="API to scrape Facebook posts and comments using stored credentials",
    version="1.0.0"
)

# Input model for better API documentation
class PostRequest(BaseModel):
    post_url: str = Field(..., description="URL of the Facebook post to scrape")

@app.post("/scrape-facebook-post", 
         description="Scrape a Facebook post and its comments using stored credentials")
async def get_facebook_comments(request: PostRequest):
    # Get the post URL from the request
    post_url = request.post_url
    
    # Get credentials from environment variables
    email = os.getenv("FB_EMAIL")
    password = os.getenv("FB_PASSWORD")
    
    if not email or not password:
        raise HTTPException(status_code=500, detail="Facebook credentials not configured")

    # Start the browser session
    async with async_playwright() as p:
        # Use headless mode but with additional configurations to avoid detection
        browser = await p.chromium.launch(
            headless=True,  
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
                # Additional args to avoid detection
                '--disable-dev-shm-usage',
                '--disable-infobars',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-component-extensions-with-background-pages',
                '--disable-extensions',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--enable-features=NetworkService,NetworkServiceInProcess',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--mute-audio',
            ]
        )
        
        # Create a context with more realistic browser parameters
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            is_mobile=False,
            has_touch=False,
            locale='en-US',
            timezone_id='America/New_York',
            color_scheme='light',
            java_script_enabled=True,
            bypass_csp=True,
        )
        
        # Enable JavaScript console logging
        context.on('console', lambda msg: print(f'BROWSER LOG: {msg.text}'))
        
        page = await context.new_page()

        # Add script to remove navigator.webdriver flag
        await page.add_init_script('''() => {
            // Overwrite the 'webdriver' property to undefined
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            // Overwrite the chrome driver related properties
            window.navigator.chrome = { runtime: {} };
            
            // Overwrite the permissions API
            window.navigator.permissions = {
                query: () => Promise.resolve({ state: 'granted' })
            };
            
            // Add missing plugins that a normal browser would have
            const originalPlugins = navigator.plugins;
            const pluginsData = [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                { name: 'Native Client', filename: 'internal-nacl-plugin' }
            ];
            
            // Define a new plugins property
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const plugins = { 
                        ...originalPlugins,
                        length: pluginsData.length 
                    };
                    
                    // Add the missing plugins
                    pluginsData.forEach((plugin, i) => {
                        plugins[i] = plugin;
                    });
                    
                    return plugins;
                }
            });
            
            // Fake the language property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
            
            // Fake the platform to match a Mac
            Object.defineProperty(navigator, 'platform', {
                get: () => 'MacIntel'
            });
            
            // Add a fake notification API
            if (window.Notification) {
                window.Notification.permission = 'default';
            }
        }''')

        try:
            # Step 1: Login to Facebook
            await page.goto('https://www.facebook.com/', timeout=60000)
            
            # Wait for page to fully load
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)  # Additional delay
            
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
            await asyncio.sleep(3)

            # After login
            print(f"Current URL after login: {page.url}")

            # Check for CAPTCHA
            if 'checkpoint' in page.url or 'captcha' in page.url:
                print("Detected CAPTCHA or checkpoint page")
                # Handle CAPTCHA logic here

            # Check login success
            if 'login' in page.url:
                raise HTTPException(status_code=401, detail='Login failed - Please check credentials')

            # Step 2: Scrape the post and comments
            print(f"Navigating to post URL: {post_url}")
            await page.goto(post_url, timeout=60000)
            await page.wait_for_load_state('networkidle')

            # Random wait time between 5 to 10 seconds
            await asyncio.sleep(random.uniform(5, 10))

            # Check if the comments container exists
            comments_container = await page.query_selector('div[role="article"]')
            if comments_container:
                print("Comments container found")
            else:
                print("Comments container not found")

            # Implementing scrolling
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight);')
            await asyncio.sleep(random.uniform(2, 4))  # Wait after scrolling

            # Log the page content
            content = await page.content()
            print(f"Page content: {content[:500]}")  # Print first 500 characters of the page content

            # Get post content
            post_data = await page.evaluate('''() => {
                // Try to get the post description directly from where Facebook actually stores it
                const getPostDescription = () => {
                    // First approach: Get the full text content from the post container
                    const postContainer = document.querySelector('.xjkvuk6, .xuyqlj2');
                    if (postContainer) {
                        // Get all text content divs in the post container
                        const textDivs = Array.from(postContainer.querySelectorAll('div[dir="auto"]'))
                            .map(el => el.textContent.trim())
                            .filter(text => text.length > 10 && !text.includes('See more') && !text.includes('See less'));
                        
                        // Get the full post content by joining all text segments (this gets the complete text even if split across divisions)
                        if (textDivs.length > 0) {
                            return textDivs.join(' ');
                        }
                    }
                    
                    // Second approach: Look for specific post wrapper divs by their class names
                    const wrapperSelectors = [
                        'div.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs',
                        'div.x78zum5.xdt5ytf.x4cne27.xifccgj',
                        'div.xzueoph.x1k70j0n',
                        'div.x1n2onr6'
                    ];
                    
                    for (const selector of wrapperSelectors) {
                        const wrappers = document.querySelectorAll(selector);
                        for (const wrapper of wrappers) {
                            const texts = Array.from(wrapper.querySelectorAll('div[dir="auto"], span[dir="auto"]'))
                                .map(el => el.textContent.trim())
                                .filter(text => 
                                    text.length > 30 && 
                                    !text.includes('See more') && 
                                    !text.includes('See less') &&
                                    !text.includes('#') // Avoid hashtag sections
                                );
                            
                            if (texts.length > 0) {
                                // Sort by length and get the longest text
                                return texts.sort((a, b) => b.length - a.length)[0];
                            }
                        }
                    }
                    
                    // Third approach: look for any lengthy content in the first article element (likely the post itself)
                    const firstArticle = document.querySelector('div[role="article"]');
                    if (firstArticle) {
                        const articleTexts = Array.from(firstArticle.querySelectorAll('div[dir="auto"]'))
                            .map(el => el.textContent.trim())
                            .filter(text => 
                                text.length > 40 && 
                                !text.includes('See more') && 
                                !text.includes('See less')
                            );
                        
                        if (articleTexts.length > 0) {
                            // Sort by length to get the most substantial content
                            return articleTexts.sort((a, b) => b.length - a.length)[0];
                        }
                    }
                    
                    // Final fallback: any meaningful content on the page
                    const allTextElements = Array.from(document.querySelectorAll('div[dir="auto"]'));
                    const allTexts = allTextElements
                    .map(el => el.textContent.trim())
                        .filter(text => text.length > 50);
                        
                    if (allTexts.length > 0) {
                        return allTexts.sort((a, b) => b.length - a.length)[0];
                    }
                    
                    return '';
                };

                return {
                    post_content: getPostDescription(),
                    post_url: window.location.href
                };
            }''')

            # Step 3: Expand all comments using multiple strategies
            max_attempts = 20  # Increase maximum attempts for headless mode
            attempts = 0
            total_clicks = 0
            last_comment_count = 0
            
            while attempts < max_attempts:
                # Get current comment count to check if we're making progress
                current_comment_count = await page.evaluate('''() => {
                    return document.querySelectorAll('div[role="article"]').length;
                }''')
                
                print(f"Current comment count: {current_comment_count}")
                
                if current_comment_count == last_comment_count and attempts > 5:
                    print("No new comments loaded after several attempts, stopping")
                    break
                    
                last_comment_count = current_comment_count
                
                # More aggressive scrolling strategy for headless mode
                await page.evaluate('''() => {
                    // Scroll down multiple times with small pauses
                    const scrollDown = () => {
                        window.scrollTo(0, document.body.scrollHeight);
                        return new Promise(resolve => setTimeout(resolve, 300));
                    };
                    
                    return (async () => {
                        await scrollDown();
                        await scrollDown();
                        await scrollDown();
                        return true;
                    })();
                }''')
                await asyncio.sleep(2)

                # First strategy: Use standard querySelector methods with text content checking
                click_happened = await page.evaluate('''() => {
                    // Function to simulate human-like clicking
                    const humanClick = (element) => {
                        // Move to the element (simulating mouse movement)
                        const rect = element.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        
                        // Create and dispatch mouse events
                        const mouseOverEvent = new MouseEvent('mouseover', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: x,
                            clientY: y
                        });
                        
                        const mouseDownEvent = new MouseEvent('mousedown', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: x,
                            clientY: y,
                            button: 0
                        });
                        
                        const mouseUpEvent = new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: x,
                            clientY: y,
                            button: 0
                        });
                        
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: x,
                            clientY: y
                        });
                        
                        // Dispatch the events in sequence
                        element.dispatchEvent(mouseOverEvent);
                        setTimeout(() => {
                            element.dispatchEvent(mouseDownEvent);
                            setTimeout(() => {
                                element.dispatchEvent(mouseUpEvent);
                                element.dispatchEvent(clickEvent);
                            }, 50);
                        }, 50);
                        
                        return true;
                    };
                    
                    // Try to find spans with the specific text content
                    const allSpans = Array.from(document.querySelectorAll('span'));
                    
                    // Look for spans with the exact class from the example
                    const targetSpans = allSpans.filter(span => {
                        const hasClass = span.className.includes('x193iq5w');
                        const hasText = span.textContent.includes('View more comments') || 
                                       span.textContent.includes('Previous comments');
                        return hasClass && hasText;
                    });
                    
                    // If we found target spans with the right class, try to click their parent buttons
                    if (targetSpans.length > 0) {
                        for (const span of targetSpans) {
                            const clickable = span.closest('div[role="button"]');
                            if (clickable) {
                                console.log("Found clickable with x193iq5w class");
                                clickable.scrollIntoView({behavior: "smooth", block: "center"});
                                
                                // Try both methods of clicking
                                setTimeout(() => {
                                    humanClick(clickable);
                                    setTimeout(() => clickable.click(), 100);
                                }, 100);
                                
                                return true;
                            }
                        }
                    }
                    
                    // Fallback: try all spans with the right text
                    for (const span of allSpans) {
                        if (span.textContent.includes('View more comments') || 
                            span.textContent.includes('Previous comments')) {
                            const clickable = span.closest('div[role="button"]');
                            if (clickable) {
                                console.log("Found clickable via text content search");
                                clickable.scrollIntoView({behavior: "smooth", block: "center"});
                                
                                // Try both methods of clicking
                                setTimeout(() => {
                                    humanClick(clickable);
                                    setTimeout(() => clickable.click(), 100);
                                }, 100);
                                
                                return true;
                            }
                        }
                    }
                    
                    // Try direct role buttons that contain the text
                    const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                    for (const button of buttons) {
                        if (button.textContent.includes('View more comments') || 
                            button.textContent.includes('Previous comments')) {
                            console.log("Found direct button");
                            button.scrollIntoView({behavior: "smooth", block: "center"});
                            
                            // Try both methods of clicking
                            setTimeout(() => {
                                humanClick(button);
                                setTimeout(() => button.click(), 100);
                            }, 100);
                            
                            return true;
                        }
                    }
                    
                    return false;
                }''')

                if click_happened:
                    print("Clicked on 'View more comments' button")
                    total_clicks += 1
                    await asyncio.sleep(4)  # Wait longer for comments to load in headless mode
                    await page.wait_for_load_state('networkidle')
                else:
                    print("No more 'View more comments' buttons found")
                    # Try with Playwright's direct text matching and clicking
                    try:
                        # Try clicking directly with Playwright's built-in methods
                        more_comments_button = await page.query_selector('span:has-text("View more comments")')
                        if more_comments_button:
                            parent_button = await more_comments_button.evaluate('el => el.closest("div[role=\'button\']")')
                            if parent_button:
                                await parent_button.click()
                                print("Clicked using Playwright's text matcher")
                                total_clicks += 1
                                await asyncio.sleep(4)
                                await page.wait_for_load_state('networkidle')
                                continue
                        
                        # Try finding buttons by their aria label or role
                        for label in ["View more comments", "Previous comments", "Load more comments"]:
                            try:
                                # Try using force: true to bypass any click handlers
                                await page.click(f'div[role="button"]:has-text("{label}")', 
                                                force=True, 
                                                timeout=2000)
                                print(f"Force-clicked button with text: {label}")
                                total_clicks += 1
                                await asyncio.sleep(4)
                                continue
                            except Exception:
                                pass
                            
                        # Try using JavaScript click as a last resort
                        clicked = await page.evaluate('''() => {
                            // Find any element that might be a "View more comments" button
                            const possibleButtons = Array.from(document.querySelectorAll('div[role="button"], a[role="button"], button'))
                                .filter(el => el.textContent.toLowerCase().includes('view more') ||
                                             el.textContent.toLowerCase().includes('previous comments') ||
                                             el.textContent.toLowerCase().includes('more comments'));
                            
                            if (possibleButtons.length > 0) {
                                // Click using both methods
                                const button = possibleButtons[0];
                                button.click();
                                
                                // Also try direct DOM event
                                const event = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                button.dispatchEvent(event);
                                
                                return true;
                            }
                            return false;
                        }''')
                        
                        if clicked:
                            print("Clicked using last-resort JavaScript method")
                            total_clicks += 1
                            await asyncio.sleep(4)
                            continue
                            
                    except Exception as e:
                        print(f"Error with direct click: {str(e)}")
                    
                    if total_clicks == 0 or attempts > 10:
                        # If we haven't clicked anything or tried many times, break the loop
                        break
                
                attempts += 1
            
            print(f"Made {total_clicks} clicks to expand comments")
            
            # Step 4: Scrape the comments
            comments = await page.evaluate('''() => {
                const comments = [];
                const commentElements = Array.from(document.querySelectorAll('div[role="article"]'));
                
                console.log("Total comment elements found:", commentElements.length);
                
                // Skip the first element as it's likely the post itself
                const actualComments = commentElements.slice(1);
                
                actualComments.forEach((comment, index) => {
                    try {
                        // Extract the comment content
                        const contentElements = comment.querySelectorAll('div[dir="auto"]:not([style*="display: none"])');
                        let content = '';
                        
                        // Take the longest text content as the comment
                        contentElements.forEach(el => {
                            const text = el.textContent.trim();
                            if (text && text.length > content.length) {
                                content = text;
                            }
                        });
                        
                        // Extract the author name using various selectors to catch different FB layouts
                        let author = '';
                        
                        // First try: Look for the author name in specific class patterns
                        const authorElements = [
                            // Common desktop FB pattern - strong tag with author name
                            ...comment.querySelectorAll('strong.x1heor9g, strong.html-strong'),
                            // Mobile FB pattern - span with author class
                            ...comment.querySelectorAll('span.f20'),
                            // Another common pattern - profile link with author name
                            ...comment.querySelectorAll('a[role="link"] span.xt0psk2, a[aria-label*="profile"] span'),
                            // Alternative pattern - any link within header area
                            ...comment.querySelectorAll('h3 a, h4 a, .x1heor9g a, .x11i5rnm a')
                        ];
                        
                        // Try to extract author from the found elements
                        for (const el of authorElements) {
                            const name = el.textContent.trim();
                            if (name && name.length > 0 && name.length < 50) {
                                author = name;
                                break;
                            }
                        }
                        
                        // If no author found with specific selectors, try more general approach
                        if (!author) {
                            // Look for typical author layout patterns
                            const topElements = Array.from(comment.querySelectorAll('div[dir="auto"]')).slice(0, 3);
                            for (const el of topElements) {
                                const text = el.textContent.trim();
                                // Author names are typically short and at the beginning of the comment
                                if (text && text.length > 0 && text.length < 40 && 
                                    !text.includes("Commented") && !text.includes("replied") && 
                                    !text.includes("http") && !text.includes("www.")) {
                                    author = text;
                                    break;
                                }
                            }
                        }
                        
                        if (content) {
                        comments.push({
                            'comment': content,
                                'author': author || 'Unknown User',
                                'index': index
                        });
                        }
                    } catch (e) {
                        console.error('Error processing comment:', e);
                    }
                });

                return comments;
            }''')

            # Step 5: Take a screenshot for debugging
            await page.screenshot(path='facebook_post_screenshot.png')

            formatted_data = {
                'post': {
                    'content': post_data['post_content'],
                    'url': post_data['post_url']
                },
                'comments': comments,
                'metadata': {
                    'total_comments': len(comments),
                    'scraped_at': datetime.now().isoformat(),
                    'clicks_to_expand': total_clicks
                }
            }

            # Close the browser
            await browser.close()

            return formatted_data

        except Exception as e:
            await browser.close()
            raise HTTPException(status_code=500, detail=f"Error scraping post: {str(e)}")

# Only run the FastAPI app if this file is run directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)