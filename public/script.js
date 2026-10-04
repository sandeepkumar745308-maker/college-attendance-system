// CHECK TEACHER LOGIN

async function checkTeacherLogin(){

    let response = await fetch("/check-session");

    if(!response.ok){
        window.location.href = "/teacher-login.html";
        return;
    }

    let data = await response.json();

    console.log("Teacher logged in:", data.teacherName);
}

checkTeacherLogin();  

// show teacher name

async function showTeacherName(){

    let response = await fetch("/check-session")

    if(response.ok){
        let data = await response.json();

        document.getElementById("teacherWelcome").innerText = "Welcome,"+ data.teacherName;
    }
}

showTeacherName();



//PRESENT BUTTON

 async function markPresent(button){
    let row = button.parentElement.parentElement;

    row.style.backgroundColor = "#d4edda"

    let status = row.querySelector(".status");
    status.innerText = "present";
    status.style.color = "green";  

    let rollNumber = row.cells[0].innerText;

    // SELECT SUBJECT AND LECTURE

    let subject = document.getElementById("subjectSelect").value;
    let lectureNumber = document.getElementById("lectureSelect").value;

    if(subject === ""|| lectureNumber === ""){
        alert("Please select Subject and Lecture first");
        return;
    }


    try{
        let response = await fetch("/attendance", {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body:JSON.stringify({
                rollNumber: Number(rollNumber),
                attendance: "Present",
                subject: subject,
                lectureNumber: Number(lectureNumber)


            })
        })

        let data = await response.json();

        console.log(data);

        loadDashboard();

    }catch (error){
        console.log("Attendance error:", error);

    }

   
}



//Absent button..

 async function markAbsent(button){
    let row = button.parentElement.parentElement;

    row.style.backgroundColor = "#f8d7da";

    let status = row.querySelector(".status");
    status.innerText = "Absent";
    status.style.color = "red";

    let rollNumber = row.cells[0].innerText;

    let subject = document.getElementById("subjectSelect").value

    let lectureNumber = document.getElementById("lectureSelect").value

    if(subject === ""|| lectureNumber === ""){
        alert("please select subject and lecture first");
        return;
    }

    

    try{
        let response = await fetch("/attendance",{
            method:"PUT",

            headers:{
                "Content-type": "application/json"
            },

            body: JSON.stringify({
                rollNumber: Number(rollNumber),
                attendance:"Absent",
                subject: subject,
                lectureNumber: Number(lectureNumber)
            })
        });

        let data = await response.json();
        console.log(data);

        loadDashboard();
    }catch(error){
        console.log("Attendance error:", error);
    }
}

//ADD STUDENT FORM..

let editStudentId =null;

let studentForm = 
document.getElementById("studentForm");

// console.log(studentForm);

studentForm.addEventListener("submit", function(event){

    event.preventDefault();

    //Get form value

    let studentName = document.getElementById("studentName").value;
    let rollNumber = document.getElementById("rollNumber").value;
    
    let branch = document.getElementById("branch").value;
    let semester = document.getElementById("semester").value;
    let studentMobile = document.getElementById("studentMobile").value;
    let parentMobile = document.getElementById("parentMobile").value;
    console.log("Student Mobile:", studentMobile)


    //Send data to Backend..

    // ADD OR UPDATE STUDENT 

    

    fetch("/students", {
    method: "POST",

    headers: {
        "Content-type": "application/json"
    },

    body:JSON.stringify({
        name: studentName,
        rollNumber: rollNumber,
        branch: branch,
        semester: semester,
        studentMobile: studentMobile,
        parentMobile: parentMobile
    })
})

.then(async function(response){
    let data = await response.json();

    if(response.ok){

        alert(data.message);

        editStudentId = null;

        studentForm.reset();
        loadStudents();

    }else{
        alert(data.message);
    }
})

.catch(function(error){

    console.log("Error:", error);
    alert("Something went wrong");
});





});

async function loadStudents() {

    try {
        let response = await fetch("/students");

        let students = await response.json();
        console.log("Students from MongoDB:", students)

        let tableBody = document.getElementsByTagName("tbody")[0] ;

        tableBody.innerHTML = "";

        students.forEach(function(studentData) {

            let subject = document.getElementById("subjectSelect").value

            let lectureNumber = Number(document.getElementById("lectureSelect").value)

            let totalClasses = 0;
            let presentClasses = 0;

            if(studentData.attendanceHistory){
                totalClasses = studentData.attendanceHistory.length;
                
                studentData.attendanceHistory.forEach(function(history){

                    if(history.status === "Present") {
                        presentClasses++;
                    }

                });
            }

            let attendancePercentage = 0;
            if(totalClasses>0){
                 attendancePercentage = (presentClasses/ totalClasses)*100;
            }

            attendancePercentage = attendancePercentage.toFixed(2);

            let newRow = document.createElement("tr")

            

            // CURRENT LECTURE ATTENDANCE

            let attendanceText = "Not Marked";
            let today = new Date();

            if(studentData.attendanceHistory){
                studentData.attendanceHistory.forEach(function(history){

                    let historyDate = new Date(history.date);

                    if(
                        historyDate.getFullYear() === today.getFullYear()&&
                        historyDate.getMonth() === today.getMonth()&&
                        historyDate.getDate()=== today.getDate()&&
                        history.subject === subject&&
                        history.lectureNumber === lectureNumber
                    ){
                        attendanceText = history.status
                    }

                });
            }

            let attendanceColor = "black";
            if(attendanceText === "Present"){
                attendanceColor = "green";
            }

            if(attendanceText === "Absent"){
                attendanceColor = "red";
            }

            newRow.innerHTML = `
            <td>${studentData.rollNumber}</td>
            <td>${studentData.name}</td>
            <td>${studentData.branch}</td>
            <td>${studentData.semester}</td>
            <td>${studentData.studentMobile}</td>
            <td>${studentData.parentMobile}</td>
           
           <td>

           <span class="status" style = "color:
            ${attendanceColor}">
           ${attendanceText}</span>

          

           <button class="present" onclick="markPresent(this)">Present</button>

           <button class="absent" onclick="markAbsent(this)">absent</button>

           <button class= "edit" onclick= "editStudent('${studentData._id}')">Edit</button>

           <button class= "delete" onclick= "deleteStudent('${studentData._id}')">Delete</button>




           </td>
           <td>${attendancePercentage}%</td>

            `;
        tableBody.appendChild(newRow);

        });


    }catch (error) {
        console.log("Error loading student:",error);
    }
}

loadStudents();

//LOAD ATTENDANCE HISTORY...

async function loadAttendanceHistory(){
    try{
        let response = await fetch("/students");

        let students = await response.json();

        let historyBody = document.getElementById("historyBody");

        historyBody.innerHTML = "";

        students.forEach(function(studentData){
            if(
                studentData.attendanceHistory &&
                studentData.attendanceHistory.length>0
            ){

               studentData.attendanceHistory.forEach(function(history){

                let newRow = document.createElement("tr");

                let date = new Date(history.date);

                newRow.innerHTML = `
                <td>${studentData.rollNumber}</td>
                <td>${studentData.name}</td>
                <td>${date.toLocaleDateString()}</td>
                <td>${history.subject || "_"}</td>
                <td>${history.lectureNumber || "_"}</td>

                <td>${history.status}</td>
                
                `;

                historyBody.appendChild(newRow);
               });

            }
        });
    }catch (error){
        console.log("Error loading attendance history:", error);
    }
}

loadAttendanceHistory();

let today = new Date();

let date = today.getDate()+""+
today.toLocaleString("en-US",{month: "long"})+""+
today.getFullYear();document.getElementById("currentDate").innerText = "Date:" +date;

let searchBox = document.getElementById("searchStudent");

searchBox.addEventListener("input",function(){
    let searchValue = searchBox.value.toLowerCase();

    let tableBody = document.getElementsByTagName("tbody")[0];

    let rows = tableBody.getElementsByTagName("tr");

    for(let i=0; i < rows.length; i++ ){
        let rollNumber = rows[i].cells[0].innerText.toLowerCase();

        let name = rows[i].cells[1].innerText.toLowerCase();

        if(
            rollNumber.includes(searchValue) ||
            name.includes(searchValue)
        ){
            rows[i].style.display = "";
        }else{
            rows[i].style.display = "none";
        }
    }
});




// LECTURE-WISE DASHBOARD


async function loadDashboard(){

    try{

        // GET SAVE SUBJECT AND LECTURE

        let savedSubject = localStorage.getItem("selectedSubject")

        let savedLecture = localStorage.getItem("selectedLecture")



        if(savedSubject){
            document.getElementById("subjectSelect").value = savedSubject;
        }

        if(savedLecture){
            document.getElementById("lectureSelect").value = savedLecture
        }

      let response = await fetch("/students");

      let students = await response.json();

    //   TODAY STUDENTS

    let total = students.length

    document.getElementById("totalStudents").innerText = total;

    // SELECTED SUBJECT AND LECTURE

    let subject = document.getElementById("subjectSelect").value;

    let lectureNumber = (document.getElementById("lectureSelect").value);

   

    // ager subject / teacher slect nahi hai

    if(subject === ""|| lectureNumber === ""){

        document.getElementById("presentStudents").innerText = 0;

         document.getElementById("absentStudents").innerText = 0;

          document.getElementById("averageAttendance").innerText = "0%";

          return;
    }

         let present = 0; 
         let absent = 0;

        //  TODAY
        let today = new Date();

        // CHECK EACH STUDENT 

        students.forEach(function(studentData){
            if(studentData.attendanceHistory){

                studentData.attendanceHistory.forEach(function(history){

                    let historyDate = new Date(history.date);

                    if(
                        historyDate.getFullYear() === today.getFullYear()&&

                        historyDate.getMonth() === today.getMonth()&&

                        historyDate.getDate() === today.getDate()&&
                        history.subject === subject&&
                        history.lectureNumber == Number(lectureNumber)

                    ){

                        // PRESENT
                        if(history.status === "Present"){
                            present++;
                        }

                        // ABSENT
                         if(history.status === "Absent"){
                            absent++;
                        }




                    }
                });
            }
        });

                      // SHOW PRESENT
                      document.getElementById("presentStudents").innerText = present;

                    //   SHOW ABSENT
                    document.getElementById("absentStudents").innerText = absent;

                    // CALCULATE AVERAGE ATTENDANCE

                    let markedStudents = present+absent;

                    let averageAttendance = 0;

                    if(markedStudents > 0){
                        averageAttendance = (present/markedStudents)*100;
                    }

                    // SHOW AVERAGE

                    document.getElementById("averageAttendance").innerText = averageAttendance.toFixed(2) + "%";




    }catch(error){
        console.log("Dashboard error:", error);
    }
}

loadDashboard();

document.getElementById("subjectSelect").addEventListener("change", function(){

    localStorage.setItem(
        "selectedSubject",
        this.value
    );
    loadDashboard();
});

document.getElementById("lectureSelect").addEventListener("change", function(){

    localStorage.setItem(
        "selectedLecture",
        this.value
    );
    loadDashboard();
});

// SUBJECT/LECTURE CHANGE
document.getElementById("subjectSelect").addEventListener("change", function(){
    loadStudents();
});

document.getElementById("lectureSelect").addEventListener("change", function(){
    loadStudents();
});

// EDIT STUDENT

async function editStudent(studentId){

    editingStudentId = studentId;

    let response = await fetch("/students");
    let students = await response.json();

    let studentData = students.find(function(student){
        return student._id === studentId;
    })

    if(!studentData){
        alert("Student not found");
        return;
    }

    document.getElementById("studentName").value = studentData.name;

    document.getElementById("rollNumber").value = studentData.rollNumber;

    document.getElementById("branch").value = studentData.branch;

    document.getElementById("semester").value = studentData.semester;

    document.getElementById("studentMobile").value = studentData.studentMobile;

    document.getElementById("parentMobile").value = studentData.parentMobile;

    document.getElementById("studentName").scrollIntoView({
        behavior: "smooth"
    });

    // SHOW UPDATE BUTTON

    let updateButton = document.getElementById("updateStudentButton");

    if(updateButton){
        updateButton.style.display = "inline-block"
    }

    // HIDE ADD BUTTON

    let addButton = document.querySelector("#studentFormbutton[type='submit']");

    if(addButton){
        addButton.style.display = "none"
    }
}


// UPDATE STUDENT

document.getElementById("updateStudentButton").addEventListener("click", async function(){
    
    if(!editingStudentId){
        alert("Please select to edit");
        return;

    }

    let studentName = document.getElementById("studentName").value;

     let rollNumber =  document.getElementById("rollNumber").value;

      let branch =  document.getElementById("branch").value;

       let semester =  document.getElementById("semester").value;

        let studentMobile =  document.getElementById("studentMobile").value

         let parentMobile =  document.getElementById("parentMobile").value

         let response = await fetch(
            "/students/" + editingStudentId,
            {
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json"
                },

                body:JSON.stringify({
        name: studentName,
        rollNumber: rollNumber,
        branch: branch,
        semester: semester,
        studentMobile: studentMobile,
        parentMobile: parentMobile
                })
            }
         );


         let data = await response.json();

         if(response.ok){
            alert(data.message);
            editingStudentId =null;

            document.getElementById("updateStudentButton").style.display = "none"

            document.querySelector("#studentForm button[type ='submit']").style.display = "inline-block";



            document.getElementById("studentForm").reset();

            loadStudents()
         }else{
            alert(data.message);
         }
});

// DELETE STUDENT

async function deleteStudent(studentId){

    let confirmDelete = confirm("Are you sure you want to delete this student?");

    if(!confirmDelete){
        return;
    }

    let response = await fetch ("/students/" + studentId,{
        method:"DELETE"
    });

    let data = await response.json();

    if(response.ok){
        alert(data.message);

        loadStudents();
        loadDashboard();
    }else{
        alert(data.message);
    }
}



