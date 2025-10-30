# BharatRent

A full-stack React + Firebase web application for students to rent and lend items within their campus community.

## Design

BharatRent features a **Neubrutalism + Dark Glassmorphic** design aesthetic with:
- Bold, flat color blocks combined with subtle glass effects
- Rounded edges with layered depth and soft drop shadows
- Vivid accent colors (cyan, purple, lime) on dark backgrounds
- Neumorphic glow for buttons and cards
- Smooth micro-interactions using Framer Motion
- Inter font for modern, legible typography

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase
  - Authentication (Google + Email/Password)
  - Firestore Database
  - Firebase Storage (image uploads)
- **Routing:** React Router DOM
- **State Management:** Context API
- **Date Handling:** date-fns
- **Animation:** Framer Motion
- **Icons:** Lucide React

## Features

### Authentication & Role System
- Google and Email/Password authentication
- University email validation (.edu, .ac.in, .college.edu)
- Role-based onboarding (Provider or Renter)
- Protected routes based on user roles

### Provider Dashboard
- Add and manage items for rent
- Upload item images to Firebase Storage
- Toggle item availability
- View earnings and booking statistics

### Renter Dashboard
- Browse available items
- View booking history
- Track active and completed rentals
- View total spending

### Marketplace
- Homepage with hero section and search
- Category-based filtering (Clothes, Gadgets, Books, Accessories)
- Featured items display
- Detailed item pages with image gallery

### Booking System
- Date range selection with calendar
- Automatic price calculation
- Mock payment processing
- Booking status tracking
- Real-time availability checks

## Firebase Collections

### users
```javascript
{
  email: string,
  displayName: string,
  photoURL?: string,
  role?: 'provider' | 'renter',
  university?: string,
  isVerified: boolean,
  createdAt: Timestamp
}
```

### items
```javascript
{
  providerId: string,
  providerName: string,
  title: string,
  description: string,
  category: 'clothes' | 'gadgets' | 'books' | 'accessories',
  price: number,
  images: string[],
  available: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### bookings
```javascript
{
  itemId: string,
  renterId: string,
  providerId: string,
  startDate: Timestamp,
  endDate: Timestamp,
  totalPrice: number,
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled',
  createdAt: Timestamp
}
```

### transactions
```javascript
{
  bookingId: string,
  amount: number,
  status: 'pending' | 'completed' | 'refunded',
  createdAt: Timestamp
}
```

## Setup Instructions

### 1. Clone the repository

### 2. Install dependencies
```bash
npm install
```

### 3. Create a Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password and Google)
4. Create a Firestore Database (start in test mode)
5. Enable Firebase Storage

### 4. Configure Firebase
1. Get your Firebase configuration from Project Settings
2. Update the `.env` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Note: This repository also supports a central config file at `src/firebase/firebaseConfig.ts`.
For convenience a `firebaseConfig.ts` has been included with a sample config. Replace its values with your own project credentials
or remove it and use environment variables as shown above. The application imports the Firebase config from that file in
`src/lib/firebase.ts` so changing either will update the app behavior.

### Optional: Free Cloudinary fallback for image uploads
If you prefer not to use Firebase Storage (or want a free external fallback), the app can upload images to Cloudinary
using an unsigned upload preset. By default the app will use Cloudinary when the following env vars are set, otherwise
it falls back to Firebase Storage.

Add these to your `.env` file to enable Cloudinary unsigned uploads:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

How it works:
- When `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are present, the client will POST images to the
  Cloudinary unsigned upload endpoint and store the returned `secure_url` in Firestore.
- If those env vars are not present, the app falls back to Firebase Storage (existing behavior).

To create an unsigned preset in Cloudinary:
1. Sign up at https://cloudinary.com (free tier available).
2. In the Cloudinary console go to Settings → Upload → Upload presets → Add upload preset.
3. Set `Signing Mode` to `Unsigned` and save the preset. Use that preset name as `VITE_CLOUDINARY_UPLOAD_PRESET`.

This fallback is implemented in `src/lib/imageUploader.ts`.

### 5. Set up Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /items/{itemId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.providerId;
    }

    match /bookings/{bookingId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.renterId ||
         request.auth.uid == resource.data.providerId);
      allow create: if request.auth != null;
    }

    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Set up Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. Run the development server
```bash
npm run dev
```

### 8. Build for production
```bash
npm run build
```

## Deployment

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

## Project Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── firebase.ts
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Onboarding.tsx
│   ├── Marketplace.tsx
│   ├── ItemDetails.tsx
│   ├── ProviderDashboard.tsx
│   └── RenterDashboard.tsx
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Features to Add

- Real-time notifications
- Reviews and ratings system
- Advanced search with filters
- Chat system between renters and providers
- Payment gateway integration
- Email verification
- Admin dashboard
- Analytics and reporting

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
