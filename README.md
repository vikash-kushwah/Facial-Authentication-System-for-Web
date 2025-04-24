# Facial Authentication System for Web

A full-stack facial authentication system using ReactJS, Express, MongoDB, and [face-api.js](https://github.com/justadudewhohacks/face-api.js/).  
This project enables secure user registration and login using face recognition or password fallback.

---

## Features

- **Face Registration & Login:** Users can register and log in using their face.
- **Password Fallback:** Secure password authentication as a fallback.
- **Live Camera Detection:** Uses webcam for real-time face detection.
- **Face Embedding Storage:** Stores face descriptors for fast matching.
- **RESTful API:** Node.js/Express backend with MongoDB.
- **Frontend:** ReactJS with Vite, TypeScript, and face-api.js.
- **CORS & JWT Auth:** Secure API with JWT tokens and CORS.

---

## Demo

[GitHub Repository](https://github.com/vikash-kushwah/Facial-Authentication-System-for-Web.git)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/vikash-kushwah/Facial-Authentication-System-for-Web.git
cd Facial-Authentication-System-for-Web
```

### 2. Frontend Setup

```bash
cd client
npm install
```

### 3. Backend Setup

```bash
cd ../server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
TOKEN_KEY=your_jwt_secret
NODE_ENV=development
```

### 5. Download Face-api.js Models

Download the required models from [face-api.js models](https://github.com/justadudewhohacks/face-api.js-models) and place them in:

```
client/public/models/
```

---

## Running the Project

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd ../client
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## Usage

1. **Register:** Enter your details and capture your face using the webcam.
2. **Login:** Use face recognition or fallback to password login.
3. **Face Data:** Face descriptors are securely stored and matched on login.

---

## Tech Stack

- **Frontend:** ReactJS, Vite, TypeScript, face-api.js
- **Backend:** Node.js, Express, MongoDB, JWT
- **Face Recognition:** [face-api.js](https://github.com/justadudewhohacks/face-api.js/)

---

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

## Contact

For any queries, contact:  
**Vikash Kushwah**  
Email: [2022pcecsvikash182@poornima.org](mailto:2022pcecsvikash182@poornima.org)

---