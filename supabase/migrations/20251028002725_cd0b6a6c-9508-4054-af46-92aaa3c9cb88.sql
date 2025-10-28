-- Enable realtime for consultations and consultation_messages tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;