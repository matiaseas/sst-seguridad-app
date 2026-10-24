from typing import Dict, Any

class RiskEngineService:
    """
    Servicio desacoplado para el cálculo y categorización de riesgos.
    Permite cambiar o extender la metodología sin afectar la base de datos.
    """

    PROBABILITY_LABELS = {
        1: "1 – Muy baja",
        2: "2 – Baja",
        3: "3 – Media",
        4: "4 – Alta",
        5: "5 – Muy alta"
    }

    CONSEQUENCE_LABELS = {
        1: "1 – Leve",
        2: "2 – Moderada",
        3: "3 – Importante",
        4: "4 – Grave",
        5: "5 – Muy grave"
    }

    @staticmethod
    def calculate_risk(probability: int, consequence: int) -> Dict[str, Any]:
        if not (1 <= probability <= 5) or not (1 <= consequence <= 5):
            raise ValueError("Probabilidad y Consecuencia deben estar entre 1 y 5.")

        score = probability * consequence

        if score <= 4:
            level = "Bajo"
            priority = "Control rutinario / Seguimiento periódico"
            color = "#10b981" # Esmeralda / Verde
            badge_class = "badge-success"
        elif score <= 9:
            level = "Moderado"
            priority = "Se requieren medidas preventivas planificadas"
            color = "#eab308" # Amarillo
            badge_class = "badge-warning"
        elif score <= 14:
            level = "Importante"
            priority = "Atención prioritaria y adopción de medidas en el corto plazo"
            color = "#f97316" # Naranja
            badge_class = "badge-orange"
        elif score <= 19:
            level = "Alto"
            priority = "Medidas inmediatas de control antes de continuar la labor"
            color = "#ef4444" # Rojo
            badge_class = "badge-danger"
        else: # 20 a 25
            level = "Crítico"
            priority = "Detención inmediata del trabajo hasta eliminar o controlar el peligro"
            color = "#991b1b" # Rojo muy oscuro
            badge_class = "badge-critical"

        return {
            "probability": probability,
            "consequence": consequence,
            "risk_score": score,
            "risk_level": level,
            "action_priority": priority,
            "color_hex": color,
            "badge_class": badge_class,
            "probability_label": RiskEngineService.PROBABILITY_LABELS.get(probability, ""),
            "consequence_label": RiskEngineService.CONSEQUENCE_LABELS.get(consequence, "")
        }

risk_service = RiskEngineService()
