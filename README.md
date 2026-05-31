<p align="center">
  <img src="public/favicon.svg" alt="AnonVault Logo" width="100" height="100" />
</p>

<h1 align="center">AnonVault</h1>

<p align="center">
  <strong>A Premium Private Workspace & Personal Productivity Dashboard</strong>
  <br />
  <em>एक प्रीमियम निजी कार्यक्षेत्र और व्यक्तिगत उत्पादकता डैशबोर्ड</em>
</p>

<p align="center">
  <a href="#english">English Spec</a> •
  <a href="#hindi">हिन्दी विवरण</a>
</p>

---

<a id="english"></a>
## 🇬🇧 English Specification

AnonVault is a highly secure, privacy-first personal workspace engineered to centralize hackathon event tracking, manage daily milestone checklists, brainstorm comprehensive project ideas, and store creative thoughts in an encrypted, aesthetic environment.

### 🌟 Core Modules
- **Daily Checklist**: A high-fidelity task and subtask manager that handles recurring daily, weekly, or weekday routines, synced directly with Supabase.
- **Hackathon Timeline**: Track critical registration milestones, onsite/remote statuses, PPI (Placement Interview) perks, travel reimbursements, and multiple reference links in a linear or month-grouped calendar view.
- **Idea Vault & Project Brainstorming**: Secure visual concept boards with tags, hyperlinks, and simulated image reference uploads.
- **Passcode Protection**: The workspace is locked behind an optimized 4-digit PIN screen to protect your metrics.

---

### ⚙️ Getting Started

#### 1. Database & Storage Configuration
This application is powered by Supabase. Create a free Supabase project and execute the following:
1. Open the **SQL Editor** in your Supabase dashboard and run the database creation query found in `supabase/schema.sql` (or `scripts/supabase_setup.sql`).
2. Go to the **Storage** panel, create a new public bucket, and name it exactly `idea-images` to enable uploading visual design attachments.

#### 2. Environment Configuration
Create a `.env` file in the root of the project and populate it with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_api_key
VITE_APP_PIN=your_four_digit_pin_here
```

#### 3. Launching Locally
Navigate to the project folder in your terminal and run:
```bash
# Install package dependencies
npm install

# Run local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

<a id="hindi"></a>
## 🇮🇳 हिन्दी विवरण (Hindi Specification)

AnonVault एक अत्यधिक सुरक्षित, गोपनीयता-प्रथम व्यक्तिगत कार्यक्षेत्र है जिसे हैकाथॉन इवेंट्स को ट्रैक करने, दैनिक कार्यों को प्रबंधित करने, नवीन प्रोजेक्ट विचारों का मंथन करने और रचनात्मक विचारों को सुरक्षित रखने के लिए डिज़ाइन किया गया है।

### 🌟 मुख्य विशेषताएं
- **दैनिक चेकलिस्ट**: एक एडवांस कार्य और उप-कार्य प्रबंधक जो दैनिक, साप्ताहिक या कार्यदिवस के रूटीन को प्रबंधित करता है, सीधे Supabase से सिंक होता है।
- **हैकाथॉन टाइमलाइन**: महत्वपूर्ण पंजीकरण समय सीमा, ऑनसाइट/रिमोट स्थिति, पीपीआई (प्लेसमेंट इंटरव्यू) लाभ, यात्रा प्रतिपूर्ति और मल्टीपल रेफरेंस लिंक्स को एक प्रीमियम कैलेंडर व्यू में ट्रैक करें।
- **आइडिया वॉल्ट और प्रोजेक्ट विचार**: टैग्स, हाइपरलिंक्स और इमेज अपलोड के समर्थन के साथ एक प्रीमियम सर्च-सक्षम कार्ड बोर्ड।
- **पासकोड सुरक्षा**: आपके महत्वपूर्ण डेटा की सुरक्षा के लिए पूरा कार्यक्षेत्र एक 4-अंकीय सुरक्षित पिन स्क्रीन के पीछे लॉक रहता है।

---

### ⚙️ कैसे शुरू करें

#### 1. डेटाबेस और स्टोरेज सेटअप
यह एप्लिकेशन Supabase द्वारा संचालित है। एक निःशुल्क Supabase प्रोजेक्ट बनाएं और निम्नलिखित कार्य करें:
1. अपने Supabase डैशबोर्ड में **SQL Editor** खोलें और `supabase/schema.sql` (या `scripts/supabase_setup.sql`) में दिए गए डेटाबेस क्रिएशन क्वेरी को चलाएं।
2. **Storage** पैनल में जाएं, एक नया पब्लिक बकेट बनाएं, और उसका नाम बिल्कुल `idea-images` रखें।

#### 2. एनवायरनमेंट कॉन्फ़िगरेशन
प्रोजेक्ट के रूट फोल्डर में `.env` नाम से एक फाइल बनाएं और उसे क्रेडेंशियल्स के साथ भरें:
```env
VITE_SUPABASE_URL=आपका_supabase_प्रोजेक्ट_url
VITE_SUPABASE_ANON_KEY=आपका_supabase_anon_api_key
VITE_APP_PIN=आपका_4_अंकों_का_सिक्योर_पिन
```

#### 3. लोकल सर्वर चलाएं
टर्मिनल में प्रोजेक्ट फ़ोल्डर पर जाएं और चलाएं:
```bash
# डिपेंडेंसी इनस्टॉल करें
npm install

# लोकल डेवलपमेंट सर्वर शुरू करें
npm run dev
```
अपने ब्राउज़र में [http://localhost:5173](http://localhost:5173) खोलें।

---

## 📂 Design Documentation & Links
- **[High-Level Design (HLD)](docs/hld.md)**: System architecture overview and user flows.
- **[Low-Level Design (LLD)](docs/lld.md)**: Database schemas, component models, and api definitions.
- **[Project License](LICENSE)**: MIT License © Tushar Bhardwaj.
