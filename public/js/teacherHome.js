document.addEventListener('DOMContentLoaded', async () => {
    const verifyToken = async () => {
        const token = localStorage.getItem('token'); // Get token from local storage
  
        if (!token) {
            console.error('No token found in local storage.');
            const modal = document.getElementById('loginModal');
            modal.style.display = 'block';
            document.getElementById('start-button').textContent = 'Login to Start Attendance';
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
                document.getElementById('start-button').textContent = 'Start Attendance';
                document.getElementById('teacherEmail').textContent=result.user.email;
                // getting logged user details
                // const userDetailsResponse = await fetch(`/details/${result.user.email}`, {
                //     method: 'GET',
                //     headers: {
                //         'Authorization': `Bearer ${token}`,
                //         'Content-Type': 'application/json'
                //     }
                // });
  
                // if (userDetailsResponse.ok) {
                //     const userDetails = await userDetailsResponse.json();
                //     document.getElementById('sectionName').textContent=userDetails.user.section;
                //     document.getElementById('rollNumber').textContent=userDetails.user.roll;
                // } else {
                //     console.error('Failed to fetch user details:', userDetailsResponse.statusText);
                // }
                // end of getting user details
  
            } else {
                console.error('Token verification failed:', response.statusText);
                const modal = document.getElementById('loginModal');
                modal.style.display = 'block';
                document.getElementById('attendance-button').textContent = 'Login to Mark your Attendance';
            }
        } catch (error) {
            document.getElementById('start-button').textContent = 'Login to Start Attendance';
            console.error('Error during token verification:', error);
        }
    };
  
    // Call verifyToken when the document is loaded
    document.getElementById('date-time').textContent=new Date();
    await verifyToken();
  });
  
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
//   document.getElementById('attendance-button').addEventListener('click',()=>{
//     const attendanceButton=document.getElementById('attendance-button');
//     if(attendanceButton.textContent=="Mark your Attendance"){
  
//     }
//     else{
//       document.getElementById('loginModal').style.display='block';
//     }
//   });

async function updateTimer(timerData) {
    const token = localStorage.getItem('token'); // assuming the token is stored in localStorage

    if (!token) {
        console.error('No token found');
        return;
    }

    try {
        const response = await fetch('/timer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Attach the Bearer token
            },
            body: JSON.stringify(timerData) // Send timer details in the body
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error:', errorData.message);
            return;
        }

        const result = await response.json();
        if (result.status) {
            console.log('Timer successfully updated');
        } else {
            console.error('Failed to update the timer:', result.message);
        }
    } catch (error) {
        console.error('Network or server error:', error);
    }
}
document.getElementById('start-button').addEventListener('click',()=>{
    const startButton=document.getElementById('start-button');
    if(startButton.textContent=='Login to Start Attendance'){
        document.getElementById('loginModal').style.display='block';
    }
    else{
        const timerData = {
            isActive: true,
            startedBy: document.getElementById('teacherEmail').textContent,
            startedAt: new Date(),
            section : document.getElementById('branch-select').value,
            period: document.getElementById('period-select').value,
            room:document.getElementById('room-select').value
        };
        updateTimer(timerData);
    }
    
});
async function fetchAttendance(section, period) {
    try {
      const response = await fetch(`/attendance?section=${section}&period=${period}`);
      if (response.ok) {
        const details = await response.json();
        console.log(details);
        populateTable(details.data.studentsList);
      } else {
        console.error('Failed to fetch attendance:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }

  function populateTable(studentsList) {
    const presentTableBody = document.querySelector('#PresentAttendanceTable tbody');
    const absentTableBody = document.querySelector('#AbsentAttendanceTable tbody');

    presentTableBody.innerHTML = ''; // Clear existing rows in Present table
    absentTableBody.innerHTML = '';  // Clear existing rows in Absent table

    studentsList.forEach(student => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student.roll}</td>
        <td>${student.name}</td>
        <td>${student.distance.toFixed(2)} meters</td>
      `;

      // Check distance and append to the correct table
      if (student.distance <= 30) {
        presentTableBody.appendChild(row); // Add to Present table
      } else {
        absentTableBody.appendChild(row);  // Add to Absent table
      }
    });
  }

  document.getElementById('get-list').addEventListener('click', () => {
    const section = document.getElementById('branch-select').value;
    const period = document.getElementById('period-select').value;
    fetchAttendance(section, period);
  });