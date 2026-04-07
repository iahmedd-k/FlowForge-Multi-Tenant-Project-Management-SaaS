import { motion } from "framer-motion";

const companies = ["Hulu", "Canva", "Coca-Cola", "HubSpot", "Glossier", "Lionsgate", "Carrefour", "BD"];

const SocialProof = () => (
  <section className="border-y border-border bg-muted/30 py-12">
    <div className="container text-center">
      <p className="mb-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Trusted by 186,000+ customers worldwide
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
        {companies.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="text-lg font-bold tracking-wide text-muted-foreground/50 md:text-xl"
          >
            {name}
          </motion.span>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
