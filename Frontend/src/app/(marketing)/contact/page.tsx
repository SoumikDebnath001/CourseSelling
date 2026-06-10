"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { api, apiError } from "@/lib/axios";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Your name"),
  email: z.string().email("Valid email"),
  subject: z.string().min(2, "Subject"),
  message: z.string().min(5, "A short message"),
});
type Values = z.infer<typeof schema>;

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    try {
      await api.post("/contact", values);
      toast.success("Message sent — we'll be in touch!");
      reset();
    } catch (err) {
      toast.error(apiError(err, "Could not send message"));
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-extrabold text-ink-900">Contact us</h1>
      <p className="mt-2 text-ink-500">Questions about a course or your account? Send us a note.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <input className="input" placeholder="Your name" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-ball-600">{errors.name.message}</p>}
        </div>
        <div>
          <input className="input" placeholder="Email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-ball-600">{errors.email.message}</p>}
        </div>
        <div>
          <input className="input" placeholder="Subject" {...register("subject")} />
          {errors.subject && <p className="mt-1 text-xs text-ball-600">{errors.subject.message}</p>}
        </div>
        <div>
          <textarea className="input min-h-32" placeholder="Your message" {...register("message")} />
          {errors.message && <p className="mt-1 text-xs text-ball-600">{errors.message.message}</p>}
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full py-2.5">
          Send message
        </Button>
      </form>
    </main>
  );
}
