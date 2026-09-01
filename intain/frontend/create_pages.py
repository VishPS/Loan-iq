import os

pages = [
    "Dashboard",
    "DataIntelligence",
    "RiskEngine",
    "LoanExplorer",
    "LoanDetail",
    "Anomalies",
    "Scenarios",
    "TransitionModel",
    "Explainability",
    "AIReviewer",
    "ModelPerformance",
    "DevelopmentLog",
    "ModelCard",
    "Settings"
]

os.makedirs("src/pages", exist_ok=True)

for page in pages:
    path = f"src/pages/{page}.tsx"
    with open(path, "w") as f:
        f.write(f"""export default function {page}() {{
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{page}</h1>
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    </div>
  );
}}
""")
