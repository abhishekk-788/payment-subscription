<div style="; border: 5px; padding: 20px; margin: 20px;">

## 🚀⚡ **Project: payment-subscription-api**

### 📁 **Collection: user-service**
<details>
<summary><strong>🔑 Register User</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/register`
- **URL:** `http://localhost:3005/api/users/register`
- **Body:**
    ```json
    {
        "name": "Abhishek Kumar",
        "email": "abhishekumar1404@gmail.com",
        "password": "abhishek@123"
    }
    ```
</details>

<details>
<summary><strong>🔑 Login User</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/login`
- **URL:** `http://localhost:3005/api/users/login`
- **Body:**
    ```json
    {
        "email": "abhishekumar1402@gmail.com",
        "password": "abhishek@123"
    }
    ```
</details>


<details>
<summary><strong>👤 Get User Profile</strong></summary><br>

- **Endpoint:** <span style="color: #61AFFE; font-weight: bold;">GET</span> `/api/users/profile`
- **URL:** `http://localhost:3005/api/users/profile?userId=66c43f3a24855c2357123a82`
- **Headers:**
    - `Authorization: Bearer <your_token>`
</details>

<details>
<summary><strong>🔓 Forgot Password</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/forgot-password`
- **URL:** `http://localhost:3005/api/users/forgot-password`
- **Body:**
    ```json
    {
        "email": "abhishekumar1406@gmail.com"
    }
    ```
</details>

<details>
<summary><strong>🔐 Verify OTP</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/verify-otp`
- **URL:** `http://localhost:3005/api/users/verify-otp`
- **Body:**
    ```json
    {
        "email": "abhishekumar1406@gmail.com",
        "otp": "12345"
    }
    ```
</details>

<details>
<summary><strong>🔑 Reset Password</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/reset-password`
- **URL:** `http://localhost:3005/api/users/reset-password`
- **Body:**
    ```json
    {
        "email": "abhishekumar1406@gmail.com",
        "newPassword": "abhishek@123"
    }
    ```
</details>

<details>
<summary><strong>💳 Set Default Payment Method</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/users/set-default-payment-method`
- **URL:** `http://localhost:3005/api/users/set-default-payment-method`
- **Headers:**
    - `Authorization: Bearer <your_token>`
- **Body:**
    ```json
    {
        "paymentMethodId": "pm_1PpqhOSHpa4aOdjUqJwWQ5KS",
        "userId": "66c43f3a24855c2357123a82"
    }
    ```
</details>

<details>
<summary><strong>💳 Get Payment Methods</strong></summary><br>

- **Endpoint:** <span style="color: #61AFFE; font-weight: bold;">GET</span> `/api/users/payment-methods`
- **URL:** `http://localhost:3005/api/users/payment-methods?userId=66c43f3a24855c2357123a82`
- **Headers:**
    - `Authorization: Bearer <your_token>`
</details>

<details>
<summary><strong>💳 Delete Payment Method</strong></summary><br>

- **Endpoint:** <span style="color: #F93E3E; font-weight: bold;">DELETE</span> `/api/users/payment-methods`
- **URL:** `http://localhost:3005/api/users/payment-methods?userId=66c43f3a24855c2357123a82`
- **Headers:**
    - `Authorization: Bearer <your_token>`
- **Body:**
    ```json
    {
        "paymentMethodId": "pm_1PprQ2SHpa4aOdjUS533gSgG"
    }
    ```
</details>

---

### 📁 **Collection: Subscription Service**

<details>
<summary><strong>📅 Create Subscription</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/subscriptions`
- **URL:** `http://localhost:3004/api/subscriptions`
- **Body:**
    ```json
    {
        "userId": "66c402654422fb46a000dc72",
        "amount": 1799,
        "subscriptionType": "onetime"
    }
    ```
</details>

<details>
<summary><strong>📅 Extend Subscription</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/subscriptions/:subscriptionId/extend`
- **URL:** `http://localhost:5004/api/subscriptions/66b020293bc2a6af4b67917d/extend`
- **Body:**
    ```json
    {
        "extendPaymentDays": 20
    }
    ```
</details>

<details>
<summary><strong>💰 Get Extension Charges</strong></summary><br>

- **Endpoint:** <span style="color: #FF6C37; font-weight: bold;">POST</span> `/api/subscriptions/:subscriptionId/extensionCharges`
- **URL:** `http://localhost:5004/api/subscriptions/66b020293bc2a6af4b67917d/extensionCharges`
- **Body:**
    ```json
    {
        "extendPaymentDays": 15
    }
    ```
</details>

<details>
<summary><strong>📝 Get User Subscriptions</strong></summary><br>

- **Endpoint:** <span style="color: #61AFFE; font-weight: bold;">GET</span> `/api/subscriptions/user/:userId`
- **URL:** `http://localhost:5004/api/subscriptions/user/66b01ffe883eebfca00e8ab3`
</details>

<details>
<summary><strong>📝 Get Payment History</strong></summary><br>

- **Endpoint:** <span style="color: #61AFFE; font-weight: bold;">GET</span> `/api/subscriptions/user/paymentHistory/:userId`
- **URL:** `http://localhost:5004/api/subscriptions/user/paymentHistory/66b020293bc2a6af4b67917d`
</details>

<details>
<summary><strong>🔄 Update Subscription Status</strong></summary><br>

- **Endpoint:** <span style="color: #50C878; font-weight: bold;">PUT</span> `/api/subscriptions/:subscriptionId`
- **URL:** `http://localhost:5004/api/subscriptions/66a1af96566e040a19105d72`
- **Body:**
    ```json
    {
        "status": "active"
    }
    ```
</details>

</div>
