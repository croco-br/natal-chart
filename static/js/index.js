async function calculate() {
    show_loader()
    const name = document.getElementById('name').value;
    const birthdate = document.getElementById('birthdate').value;
    const birthtime = document.getElementById('birthtime').value;
    const city = document.getElementById('city').value;
    const nation = document.getElementById('nation').value;
    const timezone = document.getElementById('timezone').value;
    const method = document.getElementById('method').value;

    const [year, month, day] = birthdate.split('-').map(Number);
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

    const resultContainer = document.getElementById('result');

    // Clear any previous results
    resultContainer.innerHTML = '';

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            const resultElement = document.createElement('pre');
            resultElement.textContent = JSON.stringify(result, null, 2); // 2 spaces indentation
            resultContainer.appendChild(resultElement);
        })
        .catch(error => {
            alert('Error calculating natal chart');
            console.error('Error:', error);
        })
        .finally(() => {
            hide_loader()
        });
}

function hide_loader() {
    const loader = document.getElementById('calculate-button');
    loader.classList.remove('is-loading');
}

function show_loader() {
    const loader = document.getElementById('calculate-button');
    loader.classList.add('is-loading');
}