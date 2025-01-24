export default async function sendEmailToNotifySeller(ticket) {

    console.log("ticket value passed to test email function os:", ticket);
    //console.log("name value passed to test email function os:", name);
    const email = ticket.sellerUser.email;
    console.log("email in sendEmailToNotifySeller is:", email);
  
    //const type = 'notify seller that their ticket has been bought';

      try {
        const response = await fetch('http://localhost:5001/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket,
            email
          }),
        });
  
        const data = await response.json();
  
        if (data.success) {
          //setSuccessMessage(data.message);
        } else {
          //setErrorMessage(data.error?.message || 'Something went wrong.');
        }
      } catch (error) {
        //setErrorMessage('Something went wrong.');
        console.error('Error sending email:', error);
      }
  }