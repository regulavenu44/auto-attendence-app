
document.addEventListener('DOMContentLoaded', async () => {
  const verifyToken = async () => {
      const token = localStorage.getItem('token'); // Get token from local storage

      if (!token) {
          console.error('No token found in local storage.');
          const modal = document.getElementById('loginModal');
          modal.style.display = 'block';
          document.getElementById('attendance-button').textContent = 'Login to Mark your Attendance';
          return;
      }

      try {
          const response = await fetch('/verify-token', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });

          if (response.ok) {
              const result = await response.json();
              document.getElementById('attendance-button').textContent = 'Mark your Attendance';

              // getting logged user details
              const userDetailsResponse = await fetch(`/details/${result.user.email}`, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  }
              });

              if (userDetailsResponse.ok) {
                  const userDetails = await userDetailsResponse.json();
                  document.getElementById('sectionName').textContent=userDetails.user.section;
                  document.getElementById('rollNumber').textContent=userDetails.user.roll;
                  document.getElementById('studentName').textContent=userDetails.user.name;
//timerEnabling
                  const timerDetails = await fetch(`/timer/${userDetails.user.section}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
    
                if (timerDetails.ok) {
                    const timerData = await timerDetails.json();
                    
                    const time1 = new Date(timerData.timer.createdAt).getTime();
                    const time2 = new Date().getTime();
                    let seconds = Math.abs(time2 - time1)/1000;
                    seconds=300-seconds;
                    if(seconds<=300){
                      document.getElementById('timerContainer').style.display = 'block';
                      startTimer(seconds); 
                    }
    
                } else {
                    console.error('Failed to fetch timer details:', timerDetails.statusText);
                }


              } else {
                  console.error('Failed to fetch user details:', userDetailsResponse.statusText);
              }
              // end of getting user details

              
              

          } else {
              console.error('Token verification failed:', response.statusText);
              const modal = document.getElementById('loginModal');
              modal.style.display = 'block';
              document.getElementById('attendance-button').textContent = 'Login to Mark your Attendance';
          }
      } catch (error) {
          console.error('Error during token verification:', error);
          document.getElementById('attendance-button').textContent = 'Login to Mark your Attendance';
      }
  };

  // Call verifyToken when the document is loaded
  await verifyToken();
});
//locations

const locations=[
  {
    "roomNumber": "301",
    "longitude":78.48414518182462,
    "latitude":17.637402513043167
  },
  {
    "roomNumber": "102",
    "longitude": 78.4870,
    "latitude": 17.3860
  },
  {
    "roomNumber": "103",
    "longitude": 78.4873,
    "latitude": 17.3870
  },
  {
    "roomNumber": "104",
    "longitude": 78.4876,
    "latitude": 17.3880
  },
  {
    "roomNumber": "105",
    "longitude": 78.4880,
    "latitude": 17.3890
  }
]

// Get elements for the login modal
const modal = document.getElementById('loginModal');
const closeModalButton = document.getElementById('closeModal');
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');

// Close the modal
closeModalButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close the modal if the user clicks outside of the modal content
window.addEventListener('click', (event) => {
  if (event.target === modal) {
      modal.style.display = 'none';
  }
});

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent the default form submission

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  try {
      const response = await fetch('/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, role }),
      });

      const result = await response.json();

      if (response.ok) {
          localStorage.setItem('token', result.token); // Store JWT in local storage
          console.log(result.user);
          if (result.user.role === "teacher") {
              window.location.href = '/teacher/home';
          } else {
              window.location.href = '/student/home';
          }
      } else {
          // Handle failure
          loginStatus.textContent = 'Login failed. Please check your credentials.';
          loginStatus.style.color = 'red';
          localStorage.removeItem('token');
      }
  } catch (error) {
      console.error('Error during login:', error);
      loginStatus.textContent = 'An error occurred. Please try again later.';
      loginStatus.style.color = 'red';
      localStorage.removeItem('token');
  }
});
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
document.getElementById('attendance-button').addEventListener('click', async () => {
  const attendanceButton = document.getElementById('attendance-button');
  
  if (attendanceButton.textContent === "Mark your Attendance") {
    const token = localStorage.getItem('token');
    try {
      const sectionName = document.getElementById('sectionName').textContent;
      
      // Fetch timer details
      const timerDetails = await fetch(`/timer/${sectionName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (timerDetails.ok) {
        const timerData = await timerDetails.json();

        // Log timerData to check structure
       
        // Ensure that the section and period properties exist in the timerData.timer
        const section = timerData.timer.section;
        const period = timerData.timer.period;
        const room = timerData.timer.room;
        // Get user's current location
        navigator.geolocation.getCurrentPosition(
         async (position) => {
            const { latitude, longitude } = position.coords;
            let distance ;
            //getting room locations
            for(let i=0;i<locations.length;i++){
              if(locations[i].roomNumber==room){
                const roomLongitude=locations[i].longitude;
                const roomLatitude=locations[i].latitude;

              

                const R = 6371; // Radius of the Earth in kilometers
                const dLat = deg2rad(roomLatitude - latitude);  // deg2rad below
                const dLon = deg2rad(roomLongitude - longitude);
                const a = 
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(roomLatitude)) * 
                  Math.sin(dLon / 2) * Math.sin(dLon / 2); 
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
               distance= R * c*1000; // Distance in kilometers
               
              }
            }
            // Create attendance data object
            const attendanceData = {
              section: section,      // Accessing section from timerData.timer
              period: period,        // Accessing period from timerData.timer
              name: document.getElementById('studentName').textContent,
              roll: document.getElementById('rollNumber').textContent,
             distance:distance
            };

           //posting attendance details

           const postResponse = await fetch('/attendance', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData) // Send data as JSON
          });

          if (postResponse.ok) {
            console.log('Attendance marked successfully');
          } else {
            console.error('Failed to post attendance:', postResponse.statusText);
          }
            // Post the attendance data (you can replace this with your actual POST logic)
            // postAttendance(attendanceData);
          },
          (error) => {
            console.error('Error getting location:', error.message);
          },
          {
            enableHighAccuracy: true, // Use GPS for better accuracy
            timeout: 5000,            // Maximum time allowed to get the location
            maximumAge: 0             // Prevent using cached location
          }
        );

      } else {
        console.error('Failed to get the timer details:', timerDetails.statusText);
      }

    } catch (error) {
      console.error('Error during token verification:', error);
    }

  } else {
    document.getElementById('loginModal').style.display = 'block';
  }
});



const startButton = document.getElementById('attendance-button');
const countdownElement = document.getElementById('countdown');
const timerContainer = document.getElementById('timerContainer');



startButton.addEventListener('click', () => {
    timerContainer.style.display = 'block'; // Show the timer container
    startTimer(5 * 60); // 5 minutes in seconds
});

function startTimer(duration) {
  let timerInterval;
    let timer = duration, minutes, seconds;
    
    timerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        document.getElementById('countdown').textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);
            timerContainer.style.display = 'none'; // Hide after timer ends
        }
    }, 1000);
}
