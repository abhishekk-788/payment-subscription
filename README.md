<div style="border: 5px; padding: 20px; margin: 20px;">

### 🎯 Design Overview
![subscription_management_system](https://github.com/user-attachments/assets/4fa5c48a-9b2b-41c3-8c71-e5ef58fd4282)

### 🛠️ System Design Definition

**System Overview**:  
A subscription management platform enabling users to extend EMI payment dates by paying a minimal charge. The platform is built using a microservices architecture that facilitates independent operation, resilience, and scalability.

**Microservices**:

```plaintext
1. User Service
   - Endpoint: /register
   - Database: users
   - RabbitMQ: Publishes to subscription_user_registration_queue and payment_user_registration_queue

   - Endpoint: /login, /profile
   - Database: users

2. Payment Service
   - Database: payment.users, payments
   - RabbitMQ:
     - Consumes user details from payment_user_registration_queue
     - Consumes payment details from subcription_queue
     - Publishes to notification_queue

3. Notification Service
   - RabbitMQ: Consumes from notification_queue
   - External: Email Service

4. Subscription Service
   - Endpoint: 
     - Create a subscription: POST /
     - Extend subscription due date: POST /:subscriptionId/extend
     - Get extension charges: POST /:subscriptionId/extensionCharges
     - Retrieve payment history for a subscription: GET /user/paymentHistory/:userId
     - Get all subscriptions for a user: GET /user/:userId
     - Update subscription status: PUT /:subscriptionId
     - Cancel a subscription: DELETE /:subscriptionId/cancel
   - RabbitMQ:
     - Publishes to payment_queue
     - Publishes to notification_queue
     - Consumes from payment_user_registration_queue

5. RabbitMQ
   - Queue: subscription_user_registration_queue
   - Queue: payment_user_registration_queue
   - Queue: payment_queue
   - Queue: notification_queue
   - Queue: update_payment_queue

6. Databases
   - User Service Database: users
   - Payment Service Database: payment.users, payments
   - Subcription Service Database: subscriptions, subscription.users, subscription.payments
   - Notification Service Database: notifications
```

### 🔄 Data Flow
![image](https://github.com/user-attachments/assets/fa1602b6-54e0-4c64-8679-2c8d91e72890)




1. **User Registration**:
    - The user registers via the `User Service`.
    - The `User Service` creates a user entry in the `users` database within its own microservice.
    - The `User Service` then publishes user data to two separate queues: `subscription_user_registration_queue` and `payment_user_registration_queue`.
    - The `Subscription Service` and `Payment Service` consume these messages to create entries in their respective `subscriptionusers` and `paymentusers` collections.

2. **Subscription Management**:
    - The user creates a subscription via the `Subscription Service`.
    - The `Subscription Service` handles the subscription creation based on the provided subscription type (e.g., one-time, 3-month, 6-month, 12-month).
    - It schedules payments by publishing messages to the `payment_queue`, which are then consumed by the `Payment Service`.
    - If the user chooses to extend a payment, the `Subscription Service` finds the nearest payment due date and publishes a message to the `update_payment_queue` to extend the payment date.
    - The `Subscription Service` also publishes relevant data to the `notification_queue` to inform the user of subscription creation or payment extensions.

3. **Payment Processing**:
    - The `Payment Service` consumes messages from the `payment_queue` (for scheduled payments) and `update_payment_queue` (for extended payments).
    - The `Payment Service` retrieves user details from the `paymentusers` collection.
    - On the scheduled payment day, the `Payment Service` processes the payment using stored card details through the Stripe payment gateway.
    - Payment details, whether successful or failed, are stored in the `payments` collection.
    - Upon processing a payment (whether successful or failed), the `Payment Service` publishes a notification to the `notification_queue`.

4. **Notification Dispatch**:
    - The `Notification Service` consumes messages from the `notification_queue`.
    - It sends out emails to users through an external email service regarding their payment status, subscription creation, or reminders.
    - The service also manages reminders for failed payments, sending notifications every 2 hours, and sending minimum balance alerts one day prior to the payment date.
  

### 🔍 API Endpoints  

### 🚀⚡ **Project: payment-subscription-api**

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
