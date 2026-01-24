# iOS Shortcuts Tutorial - Second Brain Integration

## 📱 Capture Memories from Your iPhone/iPad/Mac

This tutorial will guide you through creating an iOS Shortcut that lets you instantly save thoughts, ideas, and notes to your Second Brain with just a tap or voice command ("Hey Siri, save a memory").

---

## Prerequisites

- ✅ iOS 14+ (iPhone/iPad) or macOS 12+ (Mac)
- ✅ Shortcuts app (pre-installed on all Apple devices)
- ✅ Second Brain server running on your network
- ✅ Your server IP: **192.168.1.99**

---

## Part 1: Get Your Authentication Token

Before creating the shortcut, you need a secure token to authenticate with your Second Brain.

### Step 1: Register Your Shortcuts Account

Open **Safari** or any browser on your device and navigate to:

```
http://192.168.1.99:5173
```

1. Click **"Sign Up"** or **"Register"**
2. Fill in the form:
   - **Name**: `Shortcuts Bot` (or your name)
   - **Email**: `shortcuts@youremail.com`
   - **Password**: Create a strong password
3. Click **"Register"**

### Step 2: Get Your Token (Using Terminal or API Tool)

**Option A: Using a Mac Terminal**

Open **Terminal** and run this command:

```bash
curl -X POST http://192.168.1.99:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shortcuts@youremail.com","password":"your_password"}'
```

**Option B: Using the Shortcuts App (Recommended)**

We'll create a temporary shortcut to get your token:

1. Open **Shortcuts** app
2. Tap **"+"** to create a new shortcut
3. Search for **"Get Contents of URL"** and add it
4. Configure it:
   - **URL**: `http://192.168.1.99:3001/api/auth/login`
   - **Method**: `POST`
   - Tap **"Show More"**
   - Under **Headers**, tap **"Add new field"**:
     - **Key**: `Content-Type`
     - **Value**: `application/json`
   - Under **Request Body**, select **"JSON"**
   - Tap **"Add new field"**:
     - **Key**: `email`
     - **Value**: `shortcuts@youremail.com`
   - Tap **"Add new field"**:
     - **Key**: `password`
     - **Value**: `your_password`
5. Add **"Get Dictionary from Input"** action
6. Add **"Get Dictionary Value"** action
   - **Key**: `token`
7. Add **"Copy to Clipboard"** action
8. Name the shortcut **"Get Token"**
9. Run it - your token will be copied to clipboard!

### Step 3: Save Your Token

Your token looks like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImlhdCI6MTY0...
```

**⚠️ IMPORTANT**: 
- Copy this token and save it in **Notes** app or **Password Manager**
- You'll need it for the main shortcut
- Keep it secret - it's like a password!

---

## Part 2: Create Your "Save Memory" Shortcut

### Step 1: Create a New Shortcut

1. Open **Shortcuts** app
2. Tap **"+"** in the top-right corner
3. Tap the shortcut name at the top and rename it to: **"Save Memory"**

### Step 2: Add Input Prompt

1. Search for **"Ask for Input"** and add it
2. Configure the prompt:
   - **Prompt**: `What would you like to remember?`
   - **Input Type**: Leave as "Text"
   - **Default Answer**: (leave empty)
3. This action will be named **"Provided Input"**

### Step 3: Add API Request

1. Search for **"Get Contents of URL"** and add it
2. Tap the **URL field** and enter:
   ```
   http://192.168.1.99:3001/api/memories
   ```

3. Tap **"Show More"** to reveal additional options

4. Set **Method**: Change from `GET` to `POST`

5. Under **Headers** section:
   - Tap **"Add new field"**
     - **Key**: `Content-Type`
     - **Value**: `application/json`
   - Tap **"Add new field"** again
     - **Key**: `Authorization`
     - **Value**: `Bearer YOUR_TOKEN_HERE`
     - ⚠️ Replace `YOUR_TOKEN_HERE` with the actual token from Part 1
     - ⚠️ Make sure to keep the word `Bearer` with a space before your token

6. Under **Request Body**:
   - Select **"JSON"** from the dropdown
   - Tap **"Add new field"**:
     - **Key**: `content`
     - **Text**: Tap in the value field, then tap the **variables** button (looks like a pill) and select **"Provided Input"**

Your request should look like this:
```
{
  "content": [Provided Input]
}
```

### Step 4: Add Success Notification

1. Search for **"Show Notification"** and add it
2. In the text field, type:
   ```
   ✅ Memory saved to Second Brain!
   ```

### Step 5: (Optional) Add Error Handling

1. After the "Get Contents of URL" action, tap the three dots **"..."**
2. Toggle **"Show When Run"** ON if you want to see the raw response
3. For better error handling:
   - Add **"Get Dictionary Value"** after the URL request
   - **Key**: `success`
   - Add **"If"** condition
   - **If** `Dictionary Value` **is** `true`
   - Move the success notification inside the If block
   - Add **"Otherwise"** 
   - Add **"Show Alert"** 
   - **Alert Text**: `Failed to save memory. Check your connection.`

### Step 6: Configure Shortcut Settings (Optional but Recommended)

1. Tap the settings icon (three dots in a circle) in the top-right
2. Configure:
   - **Add to Home Screen**: Toggle ON for quick access
   - **Show in Share Sheet**: Toggle ON to save from other apps
   - **Show in Widget**: Toggle ON for home screen widget
   - **Icon**: Choose a brain 🧠 or lightbulb 💡 emoji
   - **Color**: Pick your favorite color

### Step 7: Test Your Shortcut

1. Tap **"Done"** to save
2. Tap the shortcut to run it
3. When prompted, enter: `Test memory from iOS Shortcuts`
4. You should see: **"✅ Memory saved to Second Brain!"**
5. Verify by opening your Second Brain web app at `http://192.168.1.99:5173`

---

## Part 3: Advanced - Add Optional Tags

Want to add your own tags? Here's how:

### Modify Your Shortcut:

1. Open your **"Save Memory"** shortcut
2. **After** the first "Ask for Input" action, add another **"Ask for Input"**:
   - **Prompt**: `Add tags (comma-separated, optional)`
   - **Input Type**: Text
   - **Default Answer**: (leave empty)
   - Rename this variable to **"Tags Input"** (tap the variable name)

3. Add **"Split Text"** action:
   - **Text**: Select **"Tags Input"** variable
   - **Separator**: Custom → `,`
   - This creates an array of tags

4. Modify your **"Get Contents of URL"** Request Body:
   - Under the existing `content` field
   - Tap **"Add new field"**:
     - **Key**: `tags`
     - **Value**: Select **"Split Text"** variable

Your request body now looks like:
```
{
  "content": [Provided Input],
  "tags": [Split Text]
}
```

### Test the Enhanced Version:

1. Run the shortcut
2. First prompt: `Remember to buy groceries`
3. Second prompt: `shopping, errands` (or leave empty to skip)
4. The backend will:
   - Add your tags: `["shopping", "errands"]`
   - Add AI-generated tags: `["groceries", "reminder", "task"]`
   - Merge them: `["shopping", "errands", "groceries", "reminder", "task"]`

---

## Part 4: Enable Siri Voice Control

### Add Siri Phrase:

1. Open your **"Save Memory"** shortcut
2. Tap the settings icon (⚙️)
3. Tap **"Add to Siri"**
4. Record a phrase like:
   - `"Save a memory"`
   - `"Add to Second Brain"`
   - `"Remember this"`
5. Tap **"Done"**

### Now you can say:

> **"Hey Siri, save a memory"**

Siri will prompt you for what to remember, then save it instantly!

---

## Part 5: Using from Share Sheet

With "Show in Share Sheet" enabled, you can save content from any app:

### Example: Save a Safari Article

1. Open **Safari** and find an interesting article
2. Tap the **Share** button
3. Scroll down and tap **"Save Memory"**
4. The URL and page title will be captured automatically
5. Add your thoughts or notes
6. Tap **"Done"**

### Example: Save a Photo Caption

1. Open **Photos** app
2. Select a photo
3. Tap **Share** → **"Save Memory"**
4. Add context about the photo
5. The photo details will be saved as a memory

---

## Troubleshooting

### "Could not connect to server"
- ✅ Check that your iPhone/iPad is on the **same WiFi network** as your Second Brain server
- ✅ Verify server is running: `docker-compose ps`
- ✅ Try accessing `http://192.168.1.99:3001/health` in Safari - should show `{"status":"healthy"}`

### "Authentication failed" or "401 Unauthorized"
- ✅ Your token may have expired - get a new one from Part 1, Step 2
- ✅ Make sure you included `Bearer ` (with a space) before your token
- ✅ Check for extra spaces or line breaks in the Authorization header

### "Invalid request" or "400 Bad Request"
- ✅ Verify Content-Type header is `application/json`
- ✅ Make sure the request body is set to "JSON" format
- ✅ Check that "content" field is properly linked to "Provided Input" variable

### Shortcut runs but nothing appears in Second Brain
- ✅ Check the backend logs: `docker-compose logs -f backend`
- ✅ Verify your user account has access to the memories
- ✅ Try creating a memory from the web interface to confirm it's working

### Token security concerns
- ✅ Tokens don't expire by default in this version (consider adding expiration in production)
- ✅ Store token securely - treat it like a password
- ✅ If compromised, create a new user account with a new token

---

## Example Use Cases

### 📝 Quick Note Taking
**Siri**: "Save a memory"  
**You**: "Ideas for the Q4 marketing campaign: focus on sustainability, partner with eco-brands"  
**Result**: Categorized as "Idea", tagged with ["marketing", "Q4", "sustainability", "campaign"]

### ✅ Task Capture
**Siri**: "Save a memory"  
**You**: "Call dentist to schedule cleaning appointment"  
**Result**: Categorized as "Task", tagged with ["dentist", "appointment", "healthcare"]

### 💡 Learning Notes
**Siri**: "Save a memory"  
**You**: "TIL: React useEffect runs after render, not during. Important for avoiding race conditions"  
**Result**: Categorized as "Learning", tagged with ["React", "useEffect", "JavaScript", "TIL"]

### 🌟 Journal Entry
**Siri**: "Save a memory"  
**You**: "Had an amazing coffee chat with Sarah today. She shared great insights about product design"  
**Result**: Categorized as "Journal", tagged with ["meeting", "Sarah", "product-design", "insights"]

---

## What Happens Behind the Scenes

When you run your shortcut:

1. **Your Input** → Sent to Second Brain API
2. **AI Processing** (automatic):
   - Generates a 1-2 sentence summary
   - Picks the best category (Idea, Task, Project, Reference, Journal, Meeting, Learning, or Unsorted)
   - Extracts 3-5 relevant tags
   - Analyzes sentiment (positive, neutral, negative)
   - Creates a 1536-dimensional vector embedding for semantic search
3. **Storage** → Saved to PostgreSQL with pgvector
4. **Searchable** → Instantly available in web app, chat, and search

All of this happens in **under 2 seconds**! 🚀

---

## Next Steps

### 🎯 Create More Shortcuts

**Quick Meeting Notes**:
- Add "Date and Time" before the content
- Add default tag: "meeting"

**Daily Journal**:
- Pre-fill with date
- Add tag: "journal"
- Include weather or location

**Reading List**:
- Accept URL input
- Add tag: "to-read"

### 🔗 Combine with Other Apps

- **Apple Reminders** → Create reminder AND save to Second Brain
- **Calendar** → Save event details as memories
- **Notes** → Batch export notes to Second Brain
- **Voice Memos** → Transcribe and save

### 🔒 Enhance Security

For production use, consider:
- Using HTTPS instead of HTTP
- Implementing token expiration
- Setting up a VPN for remote access
- Using environment-specific tokens

---

## Support

Need help? Check:
- 📖 Main README: `README.md`
- 🔧 API Documentation: `http://192.168.1.99:3001/api`
- 💬 Backend logs: `docker-compose logs -f backend`

---

**Happy memory capturing!** 🧠✨

Remember: Your Second Brain is now as close as your voice. Use it frequently, and it will become an invaluable extension of your mind!
