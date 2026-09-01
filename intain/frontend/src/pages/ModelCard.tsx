import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, ShieldAlert } from "lucide-react";

export default function ModelCard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl pb-12">
      <PageHeader 
        title="MODEL CARD" 
        description="Formal governance document for the LoanIQ Machine Learning ensemble."
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">v1.4.2 Documentation</span>
        </div>
      </PageHeader>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Model Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300 leading-relaxed">
            The LoanIQ model ensemble is designed to predict the probability of adverse events (Default, Delinquency) and Prepayment for a given loan over specific future time horizons. These predictions support portfolio risk management, exception highlighting, and scenario stress testing. The models do not make autonomous credit decisions.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Prediction Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><span className="font-semibold text-risk-high">next_12m_default:</span> Probability of transitioning to Default status within the next 12 months.</li>
              <li><span className="font-semibold text-risk-moderate">next_3m_delinquency:</span> Probability of becoming &gt; 30 DPD within the next 3 months.</li>
              <li><span className="font-semibold text-blue-400">next_12m_prepayment:</span> Probability of full loan payoff within the next 12 months.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Leakage Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300 list-disc pl-4">
              <li><span className="font-semibold text-slate-200">Chronological Split:</span> Random splitting is strictly prohibited for this panel data. The validation set is an Out-Of-Time (OOT) sample (e.g., all 2024 records).</li>
              <li><span className="font-semibold text-slate-200">Target Masking:</span> Labels are constructed using forward-looking windows, and features are computed using only past data.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Detailed Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full border-slate-800">
            <AccordionItem value="training-data" className="border-slate-800">
              <AccordionTrigger className="hover:text-primary">Training Data</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                Trained on historical RMBS panel data spanning 2021-2023. Missing values were median-imputed for continuous features and mode-imputed for categorical features. Anomalies detected via Isolation Forest were down-weighted in the loss function to prevent overfitting to noisy data.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="features" className="border-slate-800">
              <AccordionTrigger className="hover:text-primary">Features</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                Core features include DTI, LTV, Credit Score, Interest Rate, Current Balance, Original Balance, and Months on Book. Engineered features include state-level economic indicators and historical delinquency velocity.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="calibration" className="border-slate-800">
              <AccordionTrigger className="hover:text-primary">Calibration</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                Because tree-based models like XGBoost can produce poorly calibrated probability estimates, all outputs are post-processed using Scikit-Learn's CalibratedClassifierCV with isotonic regression. This ensures the output can be interpreted as a true mathematical probability for scenario analysis.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="limitations" className="border-slate-800">
              <AccordionTrigger className="hover:text-primary text-amber-500">Known Limitations & Failures</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                <ul className="list-disc pl-4 space-y-2">
                  <li>The models struggle with predicting prepayment speeds during sudden, aggressive interest rate shock events (due to limited representation in the training window).</li>
                  <li>Local SHAP explanations for heavily correlated features (like LTV and Balance) may arbitrarily distribute importance between the two features.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="p-4 border border-blue-900/30 bg-blue-950/20 rounded-lg flex gap-4 mt-8">
        <ShieldAlert className="h-6 w-6 text-blue-400 shrink-0" />
        <div>
          <h4 className="font-semibold text-slate-200">Responsible AI & Human-in-the-loop</h4>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            The outputs of this model are routed through a generative AI reviewer to synthesize evidence for a human analyst. The AI reviewer is explicitly prohibited from generating novel predictions or modifying the XGBoost probabilities. Final credit actions require human approval.
          </p>
        </div>
      </div>
    </div>
  );
}
