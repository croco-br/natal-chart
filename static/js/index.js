async function calculate() {
    const name = document.getElementById('name').value;
    const birthdate = document.getElementById('birthdate').value;
    const birthtime = document.getElementById('birthtime').value;
    const city = document.getElementById('city').value;
    const nation = document.getElementById('nation').value;
    const timezone = document.getElementById('timezone').value;
    const method = document.getElementById('method').value;

    // Split the birthdate into year, month, and day
    const [year, month, day] = birthdate.split('-').map(Number);

    // Split the birthtime into hour and minute
    const [hour, minute] = birthtime.split(':').map(Number);

    const data = {
        name: name,
        year: year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        city: city,
        nation: nation,
        timezone: timezone,
        method: method
    };



    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => 
       response.json())
    .then(result => {
        alert('Natal chart calculated successfully!');
        console.log(result);
    })
    .catch(error => {
        alert('Error calculating natal chart');
        console.error('Error:', error);
    });
}
