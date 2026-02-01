import { useState } from 'react';
import { endpoints } from '../../lib/api';
import { Sparkles, Bot, ThumbsUp } from 'lucide-react';

export function Advisor() {
    const [advice, setAdvice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getAdvice = async () => {
        setLoading(true);
        try {
            const res = await endpoints.getAdvice();
            setAdvice(res.data.advice);
        } catch (error) {
            console.error(error);
            setAdvice("Sorry, I couldn't reach the financial brain right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/80 to-primary rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                    <Bot className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Smart Financial Advisor</h2>
                <p className="mt-2 text-muted-foreground">
                    Powered by Google Gemini. I analyze your spending to find ways to save.
                </p>
            </div>

            {!advice && (
                <button
                    onClick={getAdvice}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center mx-auto"
                >
                    {loading ? 'Analyzing Finances...' : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze My Spending
                        </>
                    )}
                </button>
            )}

            {advice && (
                <div className="mt-8 bg-card p-8 rounded-2xl shadow-xl border border-border text-left animate-in fade-in slide-in-from-bottom-8">
                    <h3 className="font-bold text-xl mb-4 text-primary flex items-center">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Coach's Advice:
                    </h3>
                    <p className="text-foreground text-lg leading-relaxed whitespace-pre-line font-mono">
                        {advice}
                    </p>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setAdvice(null)}
                            className="text-sm text-muted-foreground hover:text-primary flex items-center"
                        >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Helpful
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
