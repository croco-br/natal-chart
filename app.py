from flask import Flask, request

from natal import calculate_natal_chart, relationship

app = Flask(__name__)

@app.route('/')
def hello_world():
    a = calculate_natal_chart("Adr", 1990, 6, 25, 22, 15, "Tatuapé", "America/Sao_Paulo", "Brazil")
    b = calculate_natal_chart("Lare", 1989, 7, 7, 12, 00, "Santo André", "America/Sao_Paulo", "Brazil")
    r = relationship(a,b)
    return "r"

@app.route('/natal')
def calculate_natal_chart_route():
    name = request.args.get('name')
    year = int(request.args.get('year'))
    month = int(request.args.get('month'))
    day = int(request.args.get('day'))
    hour = int(request.args.get('hour'))
    minute = int(request.args.get('minute'))
    city = request.args.get('city')
    timezone = request.args.get('timezone')
    nation = request.args.get('nation')

    # Call the calculate_natal_chart function with the provided parameters
    result = calculate_natal_chart(name, year, month, day, hour, minute, city, timezone, nation)
    return result.json()

if __name__ == '__main__':
    app.run(debug=True)
