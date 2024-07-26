### Infrastructure Definition

```plaintext
1. User Service
   - Endpoint: /register
   - Database: users
   - RabbitMQ: Publishes to user_registration_queue

2. Payment Service
   - Endpoint: /make-payment
   - Database: payment.users, payments
   - RabbitMQ:
     - Consumes from user_registration_queue
     - Publishes to payment_notification_queue

3. Notification Service
   - RabbitMQ: Consumes from payment_notification_queue
   - External: Email Service

4. RabbitMQ
   - Queue: user_registration_queue
   - Queue: payment_notification_queue

5. Databases
   - User Service Database: users
   - Payment Service Database: payment.users, payments
```

---

### System Design Definition

**System Overview**:  
A subscription management platform enabling users to extend EMI payment dates by paying a minimal charge, built using a microservices architecture.

**Microservices**:

1. **Userservice**
    - **Responsibilities**: Handles user registration and management.
    - **Database**: MongoDB (`users` collection).
    - **Communication**: Publishes user data to RabbitMQ (`user_registration_queue`).

2. **Paymentservice**
    - **Responsibilities**: Processes payments and manages EMI extensions.
    - **Database**: MongoDB (`payments` and `payment.users` collections).
    - **Communication**:
        - Consumes user data from RabbitMQ (`user_registration_queue`).
        - Publishes payment data to RabbitMQ (`payment_notification_queue`).

3. **Notificationservice**
    - **Responsibilities**: Sends email notifications for successful payments.
    - **Database**: None (stateless).
    - **Communication**: Consumes payment data from RabbitMQ (`payment_notification_queue`).


**Data Flow**:
1. User registers via `userservice`.
    - `userservice` creates user entry in `users` collection.
    - `userservice` publishes user data to `user_registration_queue`.
2. `paymentservice` consumes `user_registration_queue` and stores user data in `payment.users` collection.
3. User makes a payment via `paymentservice`.
    - `paymentservice` creates payment entry in `payments` collection.
    - `paymentservice` retrieves user email from `payment.users` collection.
    - `paymentservice` publishes payment data to `payment_notification_queue`.
4. `notificationservice` consumes `payment_notification_queue` and sends an email to the user.

---
