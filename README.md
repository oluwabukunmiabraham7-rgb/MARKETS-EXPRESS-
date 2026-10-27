# MARKET EXPRESS — repaired storefront

A static HTML/CSS/JavaScript storefront using Firebase Authentication and Cloud Firestore. The cart is stored in the browser; checkout requires a signed-in customer and creates a private order document. This version does not collect payment online and does not include a seller/admin dashboard.

## Files

- `index.html` — storefront, product search and category filtering
- `categories.html` — category-filtered catalogue
- `cart.html` — shared cart, quantity controls and totals
- `checkout.html` — customer details and order submission
- `success.html` — order ID confirmation
- `track.html` — private order lookup for signed-in owner
- `login.html`, `signup.html`, `account.html` — Firebase Authentication and account orders
- `firebase.js`, `app.js`, `styles.css` — shared application code
- `firestore.rules` — recommended baseline security rules

## Before deploying

1. In Firebase Console, open **Authentication → Sign-in method** and enable **Email/Password**.
2. Open **Firestore Database → Rules** and publish the contents of `firestore.rules`. Do not leave test-mode rules enabled.
3. Add product documents to the `products` collection. Suggested fields:
   - `name` (string, required)
   - `price` (number, NGN, required)
   - `category` (string such as `Shoes`, `Bags`, `Perfumes`, `Watches`, `Clothing`, or `Accessories`)
   - `image` (string URL; alternatively `imageUrl`)
   - `description` (string, optional)
   - `searchTags` (string or array of strings, optional)
   - `active` (boolean, optional; set to `false` to hide a product)
4. Product writes are restricted to users with the Firebase custom claim `admin: true`. Do not put admin credentials or service-account keys in browser code. Set custom claims only from a trusted server/Admin SDK workflow.
5. Deploy the files to a static host such as GitHub Pages. Open the deployed site over HTTPS. Firebase browser modules require a web server; opening HTML as a local `file://` page may not work.
6. Test signup, login, adding/removing cart items, checkout, success page and order tracking with a test account before launch.
7. Replace the privacy-policy contact placeholder with the business's verified support details. Confirm real delivery/payment arrangements before advertising them.

## Important limitations and security notes

- Browser-saved cart prices are not trusted for real commerce. This static-only implementation records the selected prices at checkout; before accepting real payments, move order creation and price validation to a trusted backend/Cloud Function that reads current product prices from Firestore.
- No payment gateway is integrated. `Bank transfer` and `Cash on delivery` are customer preferences only; the store must confirm them separately.
- The Firestore rules allow customers to create/read their own orders but only admins to change order status. Use a trusted backend or admin workflow to fulfil/update orders.
- Firebase web configuration is public client configuration, not a secret. Security depends on Firebase Authentication and correct Firestore rules. Never publish service-account keys.
- Test the rules in Firebase Rules Playground / Emulator before production. Existing Firestore collections and other site integrations were not inspected or modified by this ZIP repair.
