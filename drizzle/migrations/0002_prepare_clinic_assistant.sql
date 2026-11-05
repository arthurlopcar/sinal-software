CREATE TABLE public.clinic_assistant_settings (
 clinic_id uuid PRIMARY KEY REFERENCES public.clinics(id) ON DELETE CASCADE,
 agent_name text NOT NULL DEFAULT 'Assistente da clínica' CHECK (char_length(agent_name) BETWEEN 1 AND 80),
 clinic_facts text NOT NULL DEFAULT '' CHECK (char_length(clinic_facts) <= 6000),
 followup_text text NOT NULL DEFAULT 'Olá, {nome}! Aqui é da {clinica}. Gostaríamos de saber se deseja agendar seu retorno. Podemos ajudar?',
 send_hour integer NOT NULL DEFAULT 9 CHECK (send_hour BETWEEN 8 AND 18),
 timezone text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK (timezone = 'America/Sao_Paulo'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (char_length(followup_text) BETWEEN 20 AND 1000)
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_assistant_settings TO authenticated;
GRANT ALL ON public.clinic_assistant_settings TO service_role;
ALTER TABLE public.clinic_assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read assistant settings" ON public.clinic_assistant_settings FOR SELECT TO authenticated USING (public.is_member(clinic_id));
CREATE POLICY "owner creates assistant settings" ON public.clinic_assistant_settings FOR INSERT TO authenticated WITH CHECK (public.is_owner(clinic_id));
CREATE POLICY "owner updates assistant settings" ON public.clinic_assistant_settings FOR UPDATE TO authenticated USING (public.is_owner(clinic_id)) WITH CHECK (public.is_owner(clinic_id));

CREATE TABLE public.clinic_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
 patient_id uuid,
 contact_name text NOT NULL,
 phone text NOT NULL,
 mode text NOT NULL DEFAULT 'human' CHECK (mode IN ('agent','human','closed')),
 handoff_reason text,
 last_inbound_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,clinic_id),
 UNIQUE (clinic_id,phone)
);
GRANT SELECT ON public.clinic_conversations TO authenticated;
GRANT ALL ON public.clinic_conversations TO service_role;
ALTER TABLE public.clinic_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read conversations" ON public.clinic_conversations FOR SELECT TO authenticated USING (public.is_member(clinic_id));

CREATE TABLE public.clinic_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
 conversation_id uuid NOT NULL,
 direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
 body text NOT NULL,
 delivery_state text NOT NULL DEFAULT 'pending' CHECK (delivery_state IN ('received','pending','accepted','sent','delivered','read','failed')),
 provider_message_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (conversation_id,clinic_id) REFERENCES public.clinic_conversations(id,clinic_id) ON DELETE CASCADE
);
GRANT SELECT ON public.clinic_messages TO authenticated;
GRANT ALL ON public.clinic_messages TO service_role;
ALTER TABLE public.clinic_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read messages" ON public.clinic_messages FOR SELECT TO authenticated USING (public.is_member(clinic_id));
CREATE INDEX clinic_messages_conversation_time ON public.clinic_messages(conversation_id,created_at);

CREATE TABLE public.clinic_handoffs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
 conversation_id uuid NOT NULL,
 actor_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (conversation_id,clinic_id) REFERENCES public.clinic_conversations(id,clinic_id) ON DELETE CASCADE
);
GRANT SELECT ON public.clinic_handoffs TO authenticated;
GRANT ALL ON public.clinic_handoffs TO service_role;
ALTER TABLE public.clinic_handoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read handoffs" ON public.clinic_handoffs FOR SELECT TO authenticated USING (public.is_member(clinic_id));

CREATE FUNCTION public.take_over_conversation(_conversation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _clinic uuid;
BEGIN
 SELECT clinic_id INTO _clinic FROM public.clinic_conversations WHERE id = _conversation FOR UPDATE;
 IF _clinic IS NULL OR NOT public.is_member(_clinic) THEN RAISE EXCEPTION 'Conversa indisponível'; END IF;
 UPDATE public.clinic_conversations SET mode = 'human', handoff_reason = 'Assumida pela equipe', updated_at = now() WHERE id = _conversation;
 INSERT INTO public.clinic_handoffs(clinic_id,conversation_id,actor_id) VALUES (_clinic,_conversation,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.take_over_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.take_over_conversation(uuid) TO authenticated;