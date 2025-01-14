
//const fetch = import('node-fetch');  // Import fetch for Node.js
import fetch from 'node-fetch'; 


export async function setTicketBought(ticket, jwtToken) {

    const documentId = ticket.documentId; 

    try {
        const response = await fetch(`http://localhost:1338/api/formal-tickets/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            data: {
              bought: true
            }
          })
        });
    
        if (!response.ok) {
          throw new Error(`Failed to update ticket: ${response.statusText}`);
        }
    
        const updatedTicket = await response.json();
        console.log('Ticket updated successfully:', updatedTicket);
        return updatedTicket;
      } catch (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }
}



  export async function updateBuyerUserMultiple(documentId, buyerUserId, jwtToken) {
  
    //const ticketDocumentId = ticket.documentId;
    //const userDocumentId = user.user.documentId; //needs to be user.user.documentId
    //const userId = user.user.id;
    const token = jwtToken;
    //console.log("the userDocumentId is: ", userDocumentId);
    //console.log('User ID being sent:', userId);
    console.log('buyerUserId within setTicketMultiple is:', buyerUserId);
    console.log("documentId within setTicketMultiple is:", documentId);
    console.log("jwtToken within setTicketMultiple is:", jwtToken);


    try {
        const response = await fetch(`http://localhost:1338/api/formal-tickets/${documentId}?populate=buyerUser`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, // Include JWT token for authentication
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    //bought: true, // Set bought to true
                    buyerUser: buyerUserId, // Assign the user's documentId to buyerUser
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update ticket: ${response.statusText}`);
        }

        const updatedTicketData = await response.json();
        console.log('Ticket updated successfully:', updatedTicketData);
        return updatedTicketData; // Return the updated ticket data
    } catch (error) {
        console.error("Error updating ticket buyer:", error);
        throw error; // Rethrow the error for further handling if needed
    }

  }

  export async function updateBuyerUser(ticket, user, jwtToken) {
  
    const ticketDocumentId = ticket.documentId;
    //const userDocumentId = user.user.documentId; //needs to be user.user.documentId
    const userId = user.user.id;
    const token = jwtToken;
    //console.log("the userDocumentId is: ", userDocumentId);
    console.log('User ID being sent:', userId);


    try {
        const response = await fetch(`http://localhost:1338/api/formal-tickets/${ticketDocumentId}?populate=buyerUser`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`, // Include JWT token for authentication
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    //bought: true, // Set bought to true
                    buyerUser: userId, // Assign the user's documentId to buyerUser
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update ticket: ${response.statusText}`);
        }

        const updatedTicketData = await response.json();
        console.log('Ticket updated successfully:', updatedTicketData);
        return updatedTicketData; // Return the updated ticket data
    } catch (error) {
        console.error("Error updating ticket buyer:", error);
        throw error; // Rethrow the error for further handling if needed
    }

  }
  export async function setTicketBoughtMultiple(documentId, jwtToken) {

    //const documentId = ticket.documentId; 
    console.log("documentId within setTicketMultiple is:", documentId);
    console.log("jwtToken within setTicketMultiple is:", jwtToken);

    try {
        const response = await fetch(`http://localhost:1338/api/formal-tickets/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            data: {
              bought: true
            }
          })
        });
    
        if (!response.ok) {
          throw new Error(`Failed to update ticket: ${response.statusText}`);
        }
    
        const updatedTicket = await response.json();
        console.log('Ticket updated successfully:', updatedTicket);
        return updatedTicket;
      } catch (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }
}
export async function fetchTicketsData() {

    //const url = 'http://localhost:1338/api/formal-tickets?populate=*';
    const url = `http://localhost:1338/api/formal-tickets?filters[bought][$eq]=false&populate=*`;
    //const url = 'http://localhost:1337/api/formal-tickets?populate=buyerUser,sellerUser,*';
    //const url = 'http://localhost:1337/api/formal-tickets?populate=buyerUser,sellerUser,formalTicketCollegeBackgroundImage,formalTicketQRCode';
    //'?populate=*' is required to return media

    //implement 'pending/failed/successful' hooks, so when pending is true you can display a load icon in container body
   
   try {
   const response = await fetch(url, {
     method: "GET",
     headers: {
         "Content-type": "application/json",
     },
   });
 
   if (!response.ok) {
     const errorData = await response.json();
     throw new Error(errorData.message || "Network response was not ok");
   }
 
   const jsonResponse = await response.json();
     const entries = jsonResponse.data; // Accessing the 'data' array
     console.log("Data retrieved:", entries);
     return entries;
  } catch (error) {
    console.log("Error:", error);
  }
}


/*module.exports = {
    updateBuyerUser,
    setTicketBought
  };*/