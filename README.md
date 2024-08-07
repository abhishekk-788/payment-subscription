### Design Overview
![subscription_management_system](https://github.com/user-attachments/assets/229d51d2-54a5-4e6a-b3f4-98954b21f758)

### System Design Definition

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


**Data Flow**:
1. **User Registration**:
    - User registers via `userservice`.
    - `userservice` creates a user entry in the `users` database.
    - `userservice` publishes user data to both `subscription_user_registration_queue` and `payment_user_registration_queue`.

2. **Payment Processing**:
    - User consumes a payment via `subcriptionservice`.
    - `paymentservice` retrieves user details from `payment.users`.
    - `paymentservice` processes the payment, storing details in `payments`.
    - `paymentservice` publishes a notification to `notification_queue`.

3. **Subscription Management**:
    - Subscription events trigger `subscriptionservice`.
    - `subscriptionservice` manages subscriptions and related EMI extensions.
    - Relevant data is published to `payment_queue`, `update_payment_queue` and `notification_queue`.

4. **Notification Dispatch**:
    - `notificationservice` consumes messages from `notification_queue`.
    - Sends emails through an external service to users about their payment status or reminders.

This documentation outlines a streamlined flow, ensuring each service is designed to operate independently while communicating effectively through designated RabbitMQ queues. This architecture promotes robustness, scalability, and responsiveness within the subscription management platform.

Created by - Abhishek Kumar
