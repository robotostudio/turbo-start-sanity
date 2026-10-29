export const pricingPlansGroqProjection = /* groq */ `
  _type == "pricingPlans" => {
    ...,
    plans[]{
      ...,
      features[]
    }
  }
`;
