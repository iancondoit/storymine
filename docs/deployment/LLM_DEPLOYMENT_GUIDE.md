# LLM Deployment Guide for StoryMine

## **TL;DR: Use Railway for LLM Applications**

For StoryMine with **Claude API integration (Jordi)**, **Railway is the best choice**.

---

## **Why LLM Applications Need Special Consideration**

### **StoryMine's LLM Requirements:**
- **Claude API calls** for Jordi assistant
- **Long conversations** with historical context
- **Complex queries** about 282K+ articles
- **Real-time responses** for user interactions
- **Persistent connections** for better performance

---

## **Deployment Options for LLM Apps**

### 🏆 **1. Railway (RECOMMENDED for LLM)**

**Perfect for StoryMine because:**
- ✅ **No timeout limits** - Claude can take time for complex historical analysis
- ✅ **Persistent backend** - Maintains conversation context
- ✅ **No cold starts** - Jordi responds immediately
- ✅ **Full Docker support** - Uses your existing setup
- ✅ **Cheap** - $5-20/month
- ✅ **Simple deployment** - One command: `npm run deploy:railway`

**Deploy:**
```bash
npm run deploy:railway
```

---

### ⚠️ **2. Vercel (Limited for LLM)**

**Issues for StoryMine:**
- ❌ **15-second timeout** - Could cut off Claude responses
- ❌ **Cold starts** - Delays in Jordi responses
- ❌ **Serverless limitations** - Not ideal for persistent AI
- ✅ **Great for frontend** - But backend struggles with LLM

**Use Case:** Only if you move to lightweight AI or client-side calls

---

### ⚠️ **3. AWS App Runner (Authentication Issues)**

**Issues we encountered:**
- ❌ **ECR authentication problems** - Blocking deployment
- ❌ **Complex setup** - IAM roles, policies
- ✅ **Good for LLM** - No timeouts, persistent
- ❌ **Expensive** - $25-45/month

**Status:** Blocked by AWS account restrictions

---

### ⚠️ **4. AWS Lambda/Amplify (Limited)**

**Issues for LLM:**
- ❌ **15-minute timeout** - Usually fine, but risky
- ❌ **Cold starts** - Bad user experience for Jordi
- ❌ **Complex setup** - Serverless architecture changes needed

---

## **Railway vs Alternatives for StoryMine**

| Feature | Railway | Vercel | App Runner | Lambda |
|---------|---------|--------|------------|--------|
| **LLM Timeout** | ♾️ None | ⏰ 15s | ♾️ None | ⏰ 15min |
| **Cold Starts** | ✅ None | ❌ Yes | ✅ None | ❌ Yes |
| **Jordi Performance** | 🚀 Excellent | 🐌 Poor | 🚀 Excellent | 🔄 Variable |
| **Setup Complexity** | 🟢 Simple | 🟢 Simple | 🔴 Complex | 🔴 Complex |
| **Cost/Month** | 💚 $5-20 | 💛 $0-40 | 💛 $25-45 | 💚 $5-25 |
| **Works Now** | ✅ Yes | ✅ Yes | ❌ Blocked | 🔄 Complex |

---

## **Recommended Deployment Strategy**

### **Immediate (Today):**
```bash
npm run deploy:railway
```

### **Why This Works:**
1. **Railway handles Docker** - Uses your existing setup
2. **Perfect for Claude API** - No timeouts or cold starts  
3. **Connects to AWS RDS** - Your database works as-is
4. **Simple & Fast** - Deploy in 5 minutes
5. **Cost Effective** - Much cheaper than AWS

### **Future Options:**
- Once AWS fixes EC2 restrictions → Consider App Runner
- For static content → Use Vercel for frontend only
- For massive scale → Consider AWS Lambda with increased timeouts

---

## **StoryMine's LLM Architecture**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Railway   │    │  Claude API  │    │ AWS RDS     │
│  (Backend)  ├────┤ (Anthropic)  │    │(PostgreSQL)│
│             │    │              │    │             │
│ ┌─────────┐ │    └──────────────┘    └─────────────┘
│ │ Jordi   │ │           │                    │
│ │Assistant│ │           │                    │
│ └─────────┘ │           │                    │
│             │           │                    │
│ ┌─────────┐ │           │                    │
│ │Frontend │ │           │                    │
│ │(Next.js)│ │           │                    │
│ └─────────┘ │           │                    │
└─────────────┘           │                    │
                          │                    │
┌─────────────────────────┼────────────────────┼─────┐
│        StoryMap Intelligence Database         │     │
│     282,387 articles • 1.4M entities         │     │
│          Perfect for LLM queries             │     │
└───────────────────────────────────────────────────┘
```

---

## **Ready to Deploy?**

**For the best LLM experience with StoryMine:**

```bash
# Make script executable
chmod +x scripts/deploy-railway.sh

# Deploy (5-10 minutes)
npm run deploy:railway

# Test Jordi
curl https://your-app.railway.app/health
```

**This gives you:**
- ✅ Jordi assistant with Claude API
- ✅ Full historical intelligence database
- ✅ No timeout limitations
- ✅ Professional deployment
- ✅ Ready for StoryMap Intelligence data import 