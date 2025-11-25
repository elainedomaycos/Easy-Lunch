# 🚀 Deploy Easy Lunch to GitHub & Vercel

## 📋 Pre-Deployment Checklist

### ✅ Security Check (CRITICAL!)

Before pushing to GitHub, verify:

- [ ] `.env` file is in `.gitignore` (✅ Already done!)
- [ ] `.env.example` created with placeholder values (✅ Done!)
- [ ] No API keys visible in other files
- [ ] `config.js` is in `.gitignore` (✅ Already done!)

---

## 🔒 Step 1: Secure Your Secrets

Your `.env` file is already protected by `.gitignore`, so it won't be pushed to GitHub. Good! ✅

### Verify Protection:
```powershell
# Check what Git will ignore
git status

# Your .env file should NOT appear in the list
```

---

## 📤 Step 2: Push to GitHub

### If this is your first push:

```powershell
# Navigate to your project
cd "D:\Downloads\Easy Lunch"

# Initialize Git (if not already done)
git init

# Add all files (except those in .gitignore)
git add .

# Commit
git commit -m "Initial commit: Easy Lunch restaurant website with AI chatbot"

# Add your GitHub repository
git remote add origin https://github.com/elainedomaycos/Easy-Lunch.git

# Push to GitHub
git push -u origin main
```

### If you already have a repository:

```powershell
# Add changes
git add .

# Commit
git commit -m "Add AI chatbot and email verification"

# Push
git push origin main
```

---

## 🌐 Step 3: Deploy to Vercel

### Method 1: Via Vercel Website (Easiest)

1. **Go to [https://vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your GitHub repository** (Easy-Lunch)
5. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: Leave empty
   - Output Directory: Leave empty
6. **Click "Deploy"**

### Method 2: Via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project folder
cd "D:\Downloads\Easy Lunch"
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: easy-lunch
# - Directory: ./
# - Auto-detected settings? Yes
```

---

## 🔑 Step 4: Add Environment Variables in Vercel

**CRITICAL:** Your secrets need to be added to Vercel separately!

### In Vercel Dashboard:

1. **Go to your project** → **Settings** → **Environment Variables**

2. **Add each variable one by one:**

   | Name | Value (Get from your local .env file) |
   |------|------------------------|
   | `PAYMONGO_SECRET` | `sk_test_YOUR_PAYMONGO_KEY` |
   | `EMAIL_USER` | `your-email@gmail.com` |
   | `EMAIL_PASS` | `your gmail app password` |
   | `EMAIL_TO` | `admin-email@gmail.com` |
   | `OPENAI_API_KEY` | `sk-proj-YOUR_OPENAI_KEY` |
   | `RETURN_URL_BASE` | `https://your-vercel-app.vercel.app` |
   | `PORT` | `3000` |

3. **For each variable:**
   - Choose: **Production**, **Preview**, **Development** (all three)
   - Click **Save**

4. **Redeploy** your project after adding all variables

---

## 📝 Step 5: Update URLs After Deployment

Once deployed, Vercel gives you a URL like: `https://easy-lunch.vercel.app`

### Update these files with your new URL:

1. **In Vercel Environment Variables:**
   - Update `RETURN_URL_BASE` to your Vercel URL

2. **In your code (locally):**
   - `chat.js` line with `http://localhost:3000/api/chat`
   - Update to `https://your-vercel-app.vercel.app/api/chat`

3. **In Firebase Console:**
   - Add your Vercel domain to authorized domains
   - Go to: Firebase Console → Authentication → Settings → Authorized domains
   - Add: `your-app.vercel.app`

4. **In PayMongo Dashboard:**
   - Update webhook URL if you're using webhooks
   - Update return URLs for payment success/failure

---

## 🧪 Step 6: Test Your Deployed Site

### Test Everything:

1. **Visit your Vercel URL**
2. **Test Authentication:**
   - Sign up with email
   - Verify email works
   - Login works

3. **Test AI Chatbot:**
   - Click chat button
   - Send message
   - Verify AI responds

4. **Test Orders:**
   - Add items to cart
   - Try checkout
   - Test payment methods

5. **Test Email Notifications:**
   - Place a test order
   - Check both admin and customer emails arrive

---

## 🔧 Troubleshooting

### Problem: "Environment variables not found"
**Solution:** 
- Check Vercel dashboard → Settings → Environment Variables
- Make sure all variables are saved
- Redeploy after adding variables

### Problem: "AI Chatbot not working"
**Solution:**
- Check `OPENAI_API_KEY` is set in Vercel
- Check browser console for errors
- Verify API endpoint URL updated from localhost

### Problem: "Payments failing"
**Solution:**
- Update `RETURN_URL_BASE` to your Vercel URL
- Check PayMongo dashboard settings
- Verify webhook URLs if used

### Problem: "Email notifications not working"
**Solution:**
- Check `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_TO` in Vercel
- Gmail may block Vercel IPs - try using SendGrid or another service
- Check Vercel function logs

### Problem: "Firebase authentication not working"
**Solution:**
- Add Vercel domain to Firebase authorized domains
- Check Firebase Console → Authentication → Settings

---

## 📊 Monitor Your Deployment

### Vercel Dashboard:
- View deployment logs
- Check function execution
- Monitor bandwidth usage

### OpenAI Dashboard:
- [https://platform.openai.com/usage](https://platform.openai.com/usage)
- Monitor API usage and costs

### PayMongo Dashboard:
- Track transactions
- View payment logs

---

## 🎯 Post-Deployment Checklist

- [ ] Site is live on Vercel
- [ ] All environment variables added
- [ ] Firebase domain authorized
- [ ] Authentication works
- [ ] AI chatbot responds
- [ ] Orders can be placed
- [ ] Email notifications work
- [ ] Payments process correctly
- [ ] Mobile responsive works
- [ ] All pages load correctly

---

## 💡 Pro Tips

1. **Use Vercel Secrets** for sensitive data (already configured in vercel.json)
2. **Enable Vercel Analytics** for visitor insights
3. **Set up Custom Domain** (optional):
   - Buy domain (Namecheap, GoDaddy, etc.)
   - Add to Vercel project settings
   - Update DNS records

4. **Automatic Deployments:**
   - Every `git push` to main branch auto-deploys
   - Preview deployments for pull requests

5. **Environment-specific configs:**
   - Use different API keys for Production vs Development
   - Test with test keys before using live keys

---

## ⚠️ Important Notes

### Gmail SMTP on Vercel:
- Gmail may block Vercel's IP addresses
- Consider using:
  - **SendGrid** (free tier: 100 emails/day)
  - **Mailgun** (free tier: 5,000 emails/month)
  - **AWS SES** (very cheap)

### API Rate Limits:
- OpenAI: Monitor usage to avoid overages
- PayMongo: Check rate limits for transactions

### Vercel Limits (Free Tier):
- Function execution: 100GB-hours/month
- Bandwidth: 100GB/month
- Deployments: Unlimited
- More than enough for a restaurant website!

---

## 🆘 Need Help?

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables
3. Test locally first with `vercel dev`
4. Check Vercel documentation

---

## ✅ Summary

1. ✅ Secrets protected with `.gitignore`
2. ✅ `.env.example` created for reference
3. ✅ `vercel.json` configured
4. 📤 Push to GitHub
5. 🌐 Deploy to Vercel
6. 🔑 Add environment variables
7. 🧪 Test everything
8. 🎉 Your site is live!

**Your Easy Lunch website will be live at: `https://easy-lunch.vercel.app` (or custom domain)** 🚀🍗
