import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type WallOfFameEntry = {
  id: string;
  image_url: string;
  description: string;
  amount: number | null;
  created_at: string;
};

export default function WallOfFameSection() {
  const [fameEntries, setFameEntries] = useState<WallOfFameEntry[]>([]);
  const [loadingFame, setLoadingFame] = useState(true);

  useEffect(() => {
    async function loadFame() {
      try {
        const data = await apiFetch("/api/public/wall-of-fame");
        setFameEntries(data || []);
      } catch (err) {
        console.error("Failed to load wall of fame", err);
      } finally {
        setLoadingFame(false);
      }
    }
    loadFame();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 flex items-center gap-3">
              Wall of Fame <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-semibold tracking-wider uppercase">Live</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">Real payments made to our trusted users. We value your effort.</p>
          </div>
        </div>

        {loadingFame ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : fameEntries.length === 0 ? (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border/50">
            <p className="text-muted-foreground">The Wall of Fame is currently empty. Start earning to be featured here!</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar gap-6">
            {fameEntries.map((entry) => (
              <Card key={entry.id} className="min-w-[320px] max-w-[320px] snap-center bg-card border-border/50 shadow-lg hover:shadow-primary/10 transition-all flex-shrink-0 group overflow-hidden">
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img 
                    src={entry.image_url} 
                    alt="Payout Proof" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Payment Sent</span>
                    </div>
                    <p className="text-white text-sm opacity-90 line-clamp-3">{entry.description}</p>
                    {entry.amount && (
                      <p className="text-white font-bold text-2xl mt-3">₹{entry.amount}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
