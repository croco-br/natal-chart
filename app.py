from flask import Flask, render_template, request

from engine import calculate_natal_chart, apply_method

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate' , methods=['POST'])
def calculate():
    
    data = request.json  # Correct way to get JSON data from the request body
    
    name = data.get('name')
    year = data.get('year')
    month = data.get('month')
    day = data.get('day')
    hour = data.get('hour')
    minute = data.get('minute')
    city = data.get('city')
    timezone = data.get('timezone')
    nation = data.get('nation')
    method = data.get('method')
    
    # Call the calculate_natal_chart function with the provided parameters
    raw_data = calculate_natal_chart(name, year, month, day, hour, minute, city, timezone, nation)
    result = apply_method(raw_data, method)
    return result.json()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
