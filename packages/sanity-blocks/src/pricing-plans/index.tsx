import { Check } from "lucide-react";

export interface PricingPlan {
  _key?: string | null;
  name?: string | null;
  description?: string | null;
  price?: string | null;
  priceSuffix?: string | null;
  buttonText?: string | null;
  buttonHref?: string | null;
  featured?: boolean | null;
  features?: string[] | null;
}

export interface PricingPlansProps {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  plans?: PricingPlan[] | null;
}

export function PricingPlans({ eyebrow, title, description, plans }: Readonly<PricingPlansProps>) {
  return (
    <section className="block-section bg-zinc-950 text-zinc-50" id="pricing-plans">
      <div className="container">
        {(eyebrow || title || description) && (
          <header className="mb-12 max-w-2xl md:mb-16">
            {eyebrow ? <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p> : null}
            {title ? <h2 className="text-balance font-semibold text-3xl md:text-5xl">{title}</h2> : null}
            {description ? <p className="mt-5 text-lg text-zinc-400">{description}</p> : null}
          </header>
        )}
        <div className="bleed-x overflow-hidden border border-dotted border-zinc-600 bg-zinc-950 md:mx-0 md:rounded-sm">
          <div className="grid md:grid-cols-3">
            {plans?.map((plan, index) => (
              <article className="flex min-h-[560px] flex-col border-b border-dotted border-zinc-600 p-6 last:border-b-0 md:min-h-[600px] md:border-b-0 md:border-r md:p-9 md:last:border-r-0" key={plan._key ?? `${plan.name}-${index}`}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-medium">{plan.name}</h3>
                  {plan.featured ? <span className="bg-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-300">Recommended</span> : null}
                </div>
                {plan.description ? <p className="mt-12 max-w-sm text-lg leading-7 text-zinc-300">{plan.description}</p> : null}
                <div className="mt-10 flex items-baseline gap-2">
                  <span className="text-5xl font-medium tracking-tight">{plan.price}</span>
                  {plan.priceSuffix ? <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">{plan.priceSuffix}</span> : null}
                </div>
                {plan.buttonText ? <a className={`mt-10 inline-flex min-h-13 items-center justify-center rounded-full px-6 font-mono text-sm uppercase tracking-wide transition-colors ${plan.featured ? "bg-orange-500 text-zinc-950 hover:bg-orange-400" : "bg-zinc-800 text-zinc-50 hover:bg-zinc-700"}`} href={plan.buttonHref || "#"}>{plan.buttonText}</a> : null}
                <div className="mt-16">
                  <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">Includes:</p>
                  <ul className="mt-6 space-y-5">
                    {plan.features?.map((feature, featureIndex) => <li className="flex gap-3 text-base leading-6 text-zinc-200" key={`${feature}-${featureIndex}`}><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-zinc-500" /> <span>{feature}</span></li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
