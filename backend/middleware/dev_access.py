from fastapi import Request, Response, HTTPException
from fastapi.responses import HTMLResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os

DEV_PASSWORD = "##L05tgat35!"

class DevAccessMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for health check
        if request.url.path == "/api/health":
            return await call_next(request)
        
        # Check if user has already authenticated for dev access
        dev_access_cookie = request.cookies.get("dev_access")
        
        if dev_access_cookie == "authenticated":
            return await call_next(request)
        
        # Handle dev access form submission
        if request.url.path == "/dev-access" and request.method == "POST":
            form_data = await request.form()
            password = form_data.get("password")
            
            if password == DEV_PASSWORD:
                response = Response(status_code=302)
                response.headers["location"] = "/"
                response.set_cookie("dev_access", "authenticated", max_age=86400)  # 24 hours
                return response
            else:
                return HTMLResponse(self.get_dev_access_html(error="Invalid password"))
        
        # Show dev access page for all other requests
        if request.url.path != "/dev-access":
            return HTMLResponse(self.get_dev_access_html())
        
        return await call_next(request)
    
    def get_dev_access_html(self, error=None):
        error_html = f'<div class="error">{error}</div>' if error else ""
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Development Access - Lost Gates</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                
                .container {{
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }}
                
                .logo {{
                    font-size: 2rem;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 0.5rem;
                }}
                
                .subtitle {{
                    color: #666;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }}
                
                .warning {{
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                }}
                
                .form-group {{
                    margin-bottom: 1.5rem;
                    text-align: left;
                }}
                
                label {{
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-weight: 500;
                }}
                
                input[type="password"] {{
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }}
                
                input[type="password"]:focus {{
                    outline: none;
                    border-color: #667eea;
                }}
                
                .submit-btn {{
                    width: 100%;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }}
                
                .submit-btn:hover {{
                    transform: translateY(-1px);
                }}
                
                .error {{
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                    padding: 0.75rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🚪 Lost Gates</div>
                <div class="subtitle">Development Environment</div>
                
                <div class="warning">
                    <strong>⚠️ Service Under Development</strong><br>
                    This service is currently under development. Please enter the development password to continue.
                </div>
                
                {error_html}
                
                <form method="POST" action="/dev-access">
                    <div class="form-group">
                        <label for="password">Development Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="submit-btn">Access Service</button>
                </form>
            </div>
        </body>
        </html>
        """
