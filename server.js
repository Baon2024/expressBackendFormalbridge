import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Resend } from "resend";
import Stripe from "stripe"; // Correct way to import Stripe in ES modules
import cors from 'cors';
import { render } from "@react-email/render";

//import APIFunctionsForBackend from '../backend/APIFunctionsForBackend.js';
//const APIFunctionsForBackend = import('./APIFunctionsForBackend'); 
//import { setTicketBought } from "../src/components/APIFunctions/APIFunctions.js";
//import { updateBuyerUser } from "../src/components/APIFunctions/APIFunctions.js";
//import WelcomeEmail from "../emails/welcomeEmail";
import { setTicketBought, updateBuyerUser, setTicketBoughtMultiple, updateBuyerUserMultiple, fetchTicketsData } from "./APIFunctionsForBackend.js";

//const setTicketBought = APIFunctionsForBackend;
//const updateBuyerUser = APIFunctionsForBackend;

//const { setTicketBought, updateBuyerUser } = APIFunctionsForBackend;

dotenv.config(); // Load environment variables

let globalUser, globalTicket;

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

//console.log(process.env.RESEND_API_KEY); // Check if the API key is loaded
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = 'whsec_d841e887e13b7130ce9da8227aafc1a2c38c9289b03f48f955943ed25a67adc6';
  //replace this with the secret from the webhooks section of the Stripe Dashbord when you switch from 'test' to 'live'

// Middleware
//app.use(bodyParser.json());
app.use(cors());
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

/*app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next(); // Skip JSON body parsing for /webhook
  } else {
    bodyParser.json()(req, res, next); // Apply JSON parsing to other routes
  }
});*/
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());


// API endpoint to send an email
app.post("/api/send-email", async (req, res) => {
    console.log(req.body)
    //stdout.write(req.body); 
if (!req.body.type) {
  const { email, name } = req.body;

  try {
    // Render the email template using React Email
    //const emailHtml = render(<WelcomeEmail name={name} />);

    if (!email || !name) {
        return res.status(400).json({ success: false, message: "Email and name are required." });
      }
    

    const emailHtml = `
    <html>
      <body>
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining us at our website. We're excited to have you!</p>
      </body>
    </html>
  `;


    // Send the email using Resend API
    const response = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email",
      html: emailHtml,
    });

    res.status(200).json({ success: true, message: "Email sent!", response });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

});

app.post('/api/confirm-ticket-sold', async (req, res) => {

    const { ticket, email } = req.body;

    const emailHtml = `
      <html>
        <body>
          <h1>Your ticket has been bought!</h1>
          <p>${ticket.formalEventName} has been bought!</p>
        </body>
      </html>
    `;

try {
    // Send the email using Resend API
    const response = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: email,
        subject: "your ticket has been sold",
        html: emailHtml,
      });
  
      res.status(200).json({ success: true, message: "Email sent!", response });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: error.message });
    }


})




// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*const stripe = import("stripe")(
    // This is your test secret API key.
    'sk_test_51QNlAaG7WeMIf1DGWcfnC8nYS9rHZVfB55lhSFZ0fNFWjsbkjIpsPYAaeQmK2GyOOJL8FI32LlW926jtwyq4nsuV000FAqeymS',
    {
      apiVersion: "2023-10-16",
    }
  );*/
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  app.post("/account_link", async (req, res) => {
    try {
      const { account } = req.body;
  
      const accountLink = await stripe.accountLinks.create({
        account: account,
        return_url: `http://localhost:3006/userPage/undefined`,
        refresh_url: `http://localhost:3006/refresh/${account}`,
        type: "account_onboarding",
      });

      console.log("yje accountLink object returned is:", accountLink);
  
      res.json(accountLink);
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account link:",
        error
      );
      res.status(500);
      res.send({ error: error.message });
    }
  });


  app.post("/account", async (req, res) => {
    try {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: {
            type: "none",
          },
          fees: {
            payer: "application"
          },
          losses: {
            payments: "application", // Specify who controls losses for payments
          },
          requirement_collection: "application",
        },
        capabilities: {
            card_payments: {requested: true},
          transfers: {requested: true}
        },
        country: "GB",
      });
      
      console.log("Stripe function to create account returned this:", account); // Log before sending the response
      res.json({
        account: account.id,
      });
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account",
        error
      );
      res.status(500);
      res.send({ error: error.message });
    }
  });


  app.post('/create-checkout-session', async (req, res) => {


    //i think i need to get the ticket details by sending them in the call
    console.log("this is what has been recieved form the stripeCreateCheckoutSession function:", req.body);

    //const ticket = req.body;

    //rebuild that array, to contain the ticket and user
    const ticketAndUser = req.body;
    const ticket = ticketAndUser[0];
    console.log("ticket is:", ticket);
    globalTicket = ticket;
    const user = ticketAndUser[1];
    
    console.log("user is:", user);
    globalUser = user;


    const { formalEventName, formalTicketPrice, id, documentId } = ticket;
    const connectedAccountId = ticket.sellerUser.connectedAccountId;
    console.log("connectedAccountId taken from req.body is:", connectedAccountId);
    //const connectedAccountId  = ticket.sellerUser.connectedAccountId;
    console.log("thsi is what connectedAccountId is:", connectedAccountId);
    console.log("this is what formalEventName, formalTictePrice and id are in server.js backend:", formalEventName, formalTicketPrice, id);

    console.log("formalTicketPrice is:", formalTicketPrice);
    let finalFormalTicketPrice = formalTicketPrice * 100;
    const comissionPercentage = 0.05; //change this to change comission percent.
    const formalbridgeComission = finalFormalTicketPrice * comissionPercentage;
    console.log("formalbridgeComission is:", formalbridgeComission);
    //const commissionInPence = Math.round(formalbridgeComission * 100);

    //let finalFormalTicketprice = formalTicketPrice * 100;

    let finalComission;
    if (formalbridgeComission > 30 ) {
      finalComission = formalbridgeComission;
    } else if (formalbridgeComission < 30 || formalbridgeComission === 30 ) {
      finalComission = 30;
    } 

    console.log("finalComission is:", finalComission);
    //const productName = req.body.formalEventName;
    //const connectedAccountId = 'acct_1QaRMQ4fOg1LtcNe';

    //const connectedAccountId = 'acct_1QZhoTQAEiW5zVa4' //this is one user, to let me make this stripe api function work first

    //if this works, then need to find out how to pass the neccessary details on correctly

    //access connectedAccountId as a property of the sellerUser, accessed through the ticket

/*

  need to add dynamic functions/percentages here
  to make sure formalbridge cut is a consistent percentage of formalTicketPrice
  
  so, const formalbridgeComission = formalTicketPrice * 0.05; //not sure at what point stripe transaction fees occur
*/
  try {
  const session = await stripe.checkout.sessions.create(
    {
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: formalEventName,
            },
            unit_amount: finalFormalTicketPrice, //this is the price
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: finalComission, //this is my cut
      },
      mode: 'payment',
      success_url: `http://localhost:3006/successPage/${documentId}`, //rdirect to /successpage/${documentId}
      //need to redirect customer to the above url returned in response
      //and then id should enable correct ticket to be selected, and display qr/download
      //and could then update buyerUser and bought status in that page instead?
    },
    {
      stripeAccount: connectedAccountId, //this is the seller - presumably i get this info from ticket, so modify uploadTickjt to add stripe accountConnectedId??
    }
  );
  console.log("stripeAccount is:", connectedAccountId);
  console.log("Stripe session created:", session);
    console.log("id for sessionId is:", session.id);
  res.json({ id: session.id });

  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error.message);
    res.status(500).send("Error creating Stripe Checkout session");
  }

})

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => { 

  let event = req.body;
  //let eventTrial = req.body;
  console.log("webhook event is:", event);

  const signature = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  //console.log("webhook event after constructEvent is:", event);

  //console.log("the value of eventTrial is:", eventTrial);
  //if this works fine, can replace the simple event assignement, with this safe/protected version;

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      // setTicketBought
      // updateBuyerUser
      
      
      break;
    case 'checkout.session.completed':
      console.log("this is the stage to add updateBuyerUser and setTicketBought");

      const session = event.data.object;

      console.log("Session object:", session);

      console.log("the value of user within the checkout.session.completed condition is:", globalUser);
      console.log("the value of ticket within the checkout.session.completed condition is:", globalTicket);

      const jwtToken = globalUser.token;
      console.log("value of token from globalUser,token is:", jwtToken);

      if (globalTicket && globalUser) {
      
      setTicketBought(globalTicket, jwtToken);
      updateBuyerUser(globalTicket, globalUser, jwtToken);
      //add email function to inform seller, here
      }
      const metadata = session.metadata;
      if (metadata) {
        console.log("Metadata exists:", metadata);
      

         const ticketIds = metadata.ticketIds.split(',').map(id => (id));
         console.log("ticketIds within checkout.session.completed are:", ticketIds);
         const buyerUserId = session.metadata.buyerUserId;
         console.log("buyerUserId within checkout.session.completed is:", buyerUserId);

         ticketIds.map((ticketId) => {
          setTicketBoughtMultiple(ticketId, jwtToken);
          updateBuyerUserMultiple(ticketId, buyerUserId, jwtToken);
          //need to add email function to inform sellers, here
         })
      }

      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();


})

app.post('/create-checkout-session-destination', async (req, res) => {


  //i think i need to get the ticket details by sending them in the call
  console.log("this is what has been recieved form the stripeCreateCheckoutSession function:", req.body);

  //const ticket = req.body;

  //rebuild that array, to contain the ticket and user
  const ticketAndUser = req.body;
  const ticket = ticketAndUser[0];
  console.log("ticket is:", ticket);
  globalTicket = ticket;
  const user = ticketAndUser[1];
  
  console.log("user is:", user);
  globalUser = user;


  const { formalEventName, formalTicketPrice, id, documentId } = ticket;
  const connectedAccountId = ticket.sellerUser.connectedAccountId;
  console.log("connectedAccountId taken from req.body is:", connectedAccountId);
  //const connectedAccountId  = ticket.sellerUser.connectedAccountId;
  console.log("thsi is what connectedAccountId is:", connectedAccountId);
  console.log("this is what formalEventName, formalTictePrice and id are in server.js backend:", formalEventName, formalTicketPrice, id);

  console.log("formalTicketPrice is:", formalTicketPrice);
  let finalFormalTicketPrice = formalTicketPrice * 100;
  const comissionPercentage = 0.05; //change this to change comission percent.
  const formalbridgeComission = finalFormalTicketPrice * comissionPercentage;
  console.log("formalbridgeComission is:", formalbridgeComission);
  //const commissionInPence = Math.round(formalbridgeComission * 100);

  //let finalFormalTicketprice = formalTicketPrice * 100;

  let finalComission;
    if (formalbridgeComission > 30 ) {
      finalComission = formalbridgeComission;
    } else if (formalbridgeComission < 30 || formalbridgeComission === 30 ) {
      finalComission = 30;
    } 

  console.log("finalComission is:", finalComission);
  //const productName = req.body.formalEventName;
  //const connectedAccountId = 'acct_1QaRMQ4fOg1LtcNe';

  //const connectedAccountId = 'acct_1QZhoTQAEiW5zVa4' //this is one user, to let me make this stripe api function work first

  //if this works, then need to find out how to pass the neccessary details on correctly

  //access connectedAccountId as a property of the sellerUser, accessed through the ticket

/*

need to add dynamic functions/percentages here
to make sure formalbridge cut is a consistent percentage of formalTicketPrice

so, const formalbridgeComission = formalTicketPrice * 0.05; //not sure at what point stripe transaction fees occur
*/
try {
const session = await stripe.checkout.sessions.create(
  {
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: formalEventName,
          },
          unit_amount: finalFormalTicketPrice, //this is the price
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: finalComission,
      transfer_data: {
        destination: connectedAccountId,
      },
    },
    mode: 'payment',
  success_url:  `http://localhost:3002/successPage/${documentId}?session_id={CHECKOUT_SESSION_ID}`,
  

    //return_url: `http://localhost:3006/destinationPage/${documentId}?session_id={CHECKOUT_SESSION_ID}`,
    // this should allow me to passed the checkout_session_Id, and documentId??

    //need to redirect customer to the above url returned in response
    //and then id should enable correct ticket to be selected, and display qr/download
    //and could then update buyerUser and bought status in that page instead?
  },
);
console.log("stripeAccount is:", connectedAccountId);
console.log("Stripe session created, for destination variant:", session);
  console.log("id for sessionId is:", session.id);
res.json({ id: session.id });

} catch (error) {
  console.error("Error creating Stripe Checkout session:", error.message);
  res.status(500).send("Error creating Stripe Checkout session");
}

})

app.post('/create-checkout-session-destination-embedded', async (req, res) => {


  //i think i need to get the ticket details by sending them in the call
  console.log("this is what has been recieved form the stripeCreateCheckoutSession function:", req.body);

  //const ticket = req.body;

  //rebuild that array, to contain the ticket and user
  const ticketAndUser = req.body;
  const ticket = ticketAndUser[0];
  console.log("ticket is:", ticket);
  globalTicket = ticket;
  const user = ticketAndUser[1];
  
  console.log("user is:", user);
  globalUser = user;


  const { formalEventName, formalTicketPrice, id, documentId } = ticket;
  const connectedAccountId = ticket.sellerUser.connectedAccountId;
  console.log("connectedAccountId taken from req.body is:", connectedAccountId);
  //const connectedAccountId  = ticket.sellerUser.connectedAccountId;
  console.log("thsi is what connectedAccountId is:", connectedAccountId);
  console.log("this is what formalEventName, formalTictePrice and id are in server.js backend:", formalEventName, formalTicketPrice, id);

  console.log("formalTicketPrice is:", formalTicketPrice);
  let finalFormalTicketPrice = formalTicketPrice * 100;
  const comissionPercentage = 0.05; //change this to change comission percent.
  const formalbridgeComission = finalFormalTicketPrice * comissionPercentage;
  console.log("formalbridgeComission is:", formalbridgeComission);
  //const commissionInPence = Math.round(formalbridgeComission * 100);

  //let finalFormalTicketprice = formalTicketPrice * 100;

  let finalComission;
    if (formalbridgeComission > 30 ) {
      finalComission = formalbridgeComission;
    } else if (formalbridgeComission < 30 || formalbridgeComission === 30 ) {
      finalComission = 30;
    } 

  console.log("finalComission is:", finalComission);
  
  
  //const formalbridgeComission = formalTicketPrice * 0.05; //not sure at what point stripe transaction fees occur

try {
const session = await stripe.checkout.sessions.create(
  {
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: formalEventName,
          },
          unit_amount: finalFormalTicketPrice, //this is the price
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: finalComission,
      transfer_data: {
        destination: connectedAccountId,
      },
    },
    mode: 'payment',
  ui_mode: 'embedded',
  return_url: `http://localhost:3006/destinationPage/${documentId}?session_id={CHECKOUT_SESSION_ID}`,
  

    //return_url: `http://localhost:3006/destinationPage/${documentId}?session_id={CHECKOUT_SESSION_ID}`,
    // this should allow me to passed the checkout_session_Id, and documentId??

    //need to redirect customer to the above url returned in response
    //and then id should enable correct ticket to be selected, and display qr/download
    //and could then update buyerUser and bought status in that page instead?
  },
);
console.log("stripeAccount is:", connectedAccountId);
console.log("Stripe session created, for destination variant:", session);
  console.log("id for sessionId is:", session.id);
res.json({ session });

} catch (error) {
  console.error("Error creating Stripe Checkout session:", error.message);
  res.status(500).send("Error creating Stripe Checkout session");
}

})

app.post('/verify-payment', async (req, res) => {
  const { sessionId } = req.body;  // The session ID passed from frontend

  console.log("sessionId in verify-payment backend");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check the payment status
    if (session.payment_status === 'paid') {
      res.json({ success: true, message: 'Payment successful!' });
    } else {
      res.json({ success: false, message: 'Payment failed or pending.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/create-checkout-session-multiple', async (req, res) => {
  const cartAndTotalCartIdsAndUser = req.body;
  console.log("cartAndTotalCartIdsAndUser in backend is:", cartAndTotalCartIdsAndUser);
  const cart = cartAndTotalCartIdsAndUser[0]
  console.log("cart in the backend is:", cart);
  //set globalCart with this cart?
  const totalCartIds = cartAndTotalCartIdsAndUser[1];
  console.log("totalCartIds in teh backend is:", totalCartIds);
  const user = cartAndTotalCartIdsAndUser[2];
  console.log("user in teh backend is:", user);
  globalUser = user;

  try {
    // Create line items based on cart items
    const lineItems = cart.map(ticket => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: ticket.formalEventName,
          //description: item.description, // Optional
        },
        unit_amount: ticket.formalTicketPrice * 100, // Price in pence, needs to be * 100
      },
      quantity: 1,
    }));

    // Group tickets by seller
    const ticketsBySeller = cart.reduce((acc, ticket) => {
      const sellerAccountId = ticket.sellerUser?.connectedAccountId;
      if (!sellerAccountId) {
          throw new Error(`Ticket ${ticket.formalEventName} is missing a seller connectedAccountId.`);
      }
      if (!acc[sellerAccountId]) acc[sellerAccountId] = [];
      acc[sellerAccountId].push(ticket);
      return acc;
  }, {});

    // Calculate application fees and total amounts for each seller
    const paymentIntents = await Promise.all(
      Object.entries(ticketsBySeller).map(async ([sellerAccountId, tickets]) => {
          const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.formalTicketPrice * 100, 0); // Amount in cents
          return stripe.paymentIntents.create({
              amount: totalAmount,
              currency: 'gbp',
              transfer_data: {
                  destination: sellerAccountId, // The connected account ID of the seller
              },
              application_fee_amount: Math.round(totalAmount * 0.1), // 10% application fee
          });
      })
  );

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3006/successPage/${totalCartIds}?session_id={CHECKOUT_SESSION_ID}`,
      /*cancel_url: `${YOUR_DOMAIN}/cancel`,*/
      metadata: {
        ticketIds: `${totalCartIds}`, // Comma-separated ticket IDs
        buyerUserId: `${user.user.id}`,  // Buyer user ID
      },
    });
    console.log("session created and about to be returned from backend is:", session);
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred creating the Checkout Session' });
  }
});

app.post('/create-checkout-session-multiple-embedded', async (req, res) => {
  const cartAndTotalCartIdsAndUser = req.body;
  console.log("cartAndTotalCartIdsAndUser in backend is:", cartAndTotalCartIdsAndUser);
  const cart = cartAndTotalCartIdsAndUser[0]
  console.log("cart in the backend is:", cart);
  //set globalCart with this cart?
  const totalCartIds = cartAndTotalCartIdsAndUser[1];
  console.log("totalCartIds in teh backend is:", totalCartIds);
  const user = cartAndTotalCartIdsAndUser[2];
  console.log("user in teh backend is:", user);
  globalUser = user;

  /*try {
    // Create line items based on cart items
    const lineItems = cart.map(ticket => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: ticket.formalEventName,
          //description: item.description, // Optional
        },
        unit_amount: ticket.formalTicketPrice * 100, // Price in pence, needs to be * 100
      },
      quantity: 1,
    }));

    // Group tickets by seller
    const ticketsBySeller = cart.reduce((acc, ticket) => {
      const sellerAccountId = ticket.sellerUser?.connectedAccountId;
      if (!sellerAccountId) {
          throw new Error(`Ticket ${ticket.formalEventName} is missing a seller connectedAccountId.`);
      }
      if (!acc[sellerAccountId]) acc[sellerAccountId] = [];
      acc[sellerAccountId].push(ticket);
      return acc;
  }, {});

    // Calculate application fees and total amounts for each seller
    const paymentIntents = await Promise.all(
      Object.entries(ticketsBySeller).map(async ([sellerAccountId, tickets]) => {
          const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.formalTicketPrice * 100, 0); // Amount in cents
          return stripe.paymentIntents.create({
              amount: totalAmount,
              currency: 'gbp',
              transfer_data: {
                  destination: sellerAccountId, // The connected account ID of the seller
              },
              application_fee_amount: Math.round(totalAmount * 0.1), // 10% application fee
          });
      })
  );

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3006/successPage/${totalCartIds}?session_id={CHECKOUT_SESSION_ID}`,
      /*cancel_url: `${YOUR_DOMAIN}/cancel`,
      metadata: {
        ticketIds: `${totalCartIds}`, // Comma-separated ticket IDs
        buyerUserId: `${user.user.id}`,  // Buyer user ID
      },
    });
    console.log("session created and about to be returned from backend is:", session);
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred creating the Checkout Session' });
  }*/
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [], // We'll populate this with seller line items
      mode: 'payment',
      success_url: `http://localhost:3006/successPage/${totalCartIds}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3006/cancel`,
      metadata: {
        ticketIds: `${totalCartIds}`, // Comma-separated ticket IDs
        buyerUserId: `${user.user.id}`, // Buyer user ID
      },
    });
    
    // Group tickets by seller
    const ticketsBySeller = cart.reduce((acc, ticket) => {
      const sellerAccountId = ticket.sellerUser?.connectedAccountId;
      if (!sellerAccountId) {
        throw new Error(`Ticket ${ticket.formalEventName} is missing a seller connectedAccountId.`);
      }
      if (!acc[sellerAccountId]) acc[sellerAccountId] = [];
      acc[sellerAccountId].push(ticket);
      return acc;
    }, {});
    
    // Create line items and add transfer data to each
    let totalAmount = 0;
    
    Object.entries(ticketsBySeller).forEach(([sellerAccountId, tickets]) => {
      const sellerTotalAmount = tickets.reduce((sum, ticket) => sum + ticket.formalTicketPrice * 100, 0); // Total price for this seller
    
      // Add line item for this seller
      session.line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Tickets from ${tickets[0].sellerUser?.name}`,
            description: tickets.map(ticket => ticket.formalEventName).join(', '),
          },
          unit_amount: sellerTotalAmount, // Total amount for this seller
        },
        quantity: 1,
        adjustable_quantity: { enabled: false, minimum: 1 },
        metadata: {
          sellerAccountId, // Track seller info
        },
        transfer_data: {
          destination: sellerAccountId, // Send funds to the seller's connected account
        },
      });
    
      totalAmount += sellerTotalAmount; // Add seller amount to the total
    });
    
    // Create the Checkout Session with all line items
    const finalSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: session.line_items, // All the line items
      mode: 'payment',
      success_url: `http://localhost:3006/successPage/${totalCartIds}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3006/cancel`,
      metadata: {
        ticketIds: `${totalCartIds}`, // Comma-separated ticket IDs
        buyerUserId: `${user.user.id}`, // Buyer user ID
      },
    });
    
    console.log("Checkout session created:", finalSession);
    
    res.json({
      sessionId: finalSession.id, // Return sessionId to the frontend for the redirect
    });
  });

/*app.post('/create-checkout-session-multiple', async (req, res) => {
    
    
    const { cart } = req.body;
    console.log("the cart object recieved in the server in create-checkout-session-multiple endpoint is:", cart);
  
    try {
      // Calculate total price for the cart
      const totalAmount = cart.reduce((total, item) => total + item.formalTicketPrice, 0);
  
      // Create a single PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount, // Total amount in cents
        currency: 'gbp',
        payment_method_types: ['card'],
      });
  
      // After the payment is successful, distribute the funds
      const transferResults = await Promise.all(
        cart.map(async (item) => {
          return stripe.transfers.create({
            amount: item.formalTicketPrice, // Amount for each ticket
            currency: 'gbp',
            destination: item.sellerUser.connectedAccountId, // Connected account for the seller
          });
        })
      );
  
      res.json({ clientSecret: paymentIntent.client_secret, transferResults });
    } catch (error) {
      console.error('Error creating checkout session for multiple tickets:', error);
      res.status(500).send('Internal Server Error');
    }
  });*/
app.use('/getTickets', async (req, res, next) => {

  try {
    console.log("Request received:", req.body);

    // Fetch tickets from your data source, and the endpoint URL is strapi-filtered for only unbought tickets
    const fetchedFilteredTickets = await fetchTicketsData();
    console.log("these are what fetchedTickets from strapi via backend are:", fetchedFilteredTickets);

    // Filter tickets to include only unsold ones
    //const relevantTicketsToReturn = fetchedTickets.filter(ticket => ticket.bought === false);
    //console.log("these are what the not-bought fetchedTickets from strapi via backend are:", relevantTicketsToReturn);

    // Send the filtered tickets as response
    res.status(200).json(fetchedFilteredTickets);
} catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "An error occurred while fetching tickets." });
}

})