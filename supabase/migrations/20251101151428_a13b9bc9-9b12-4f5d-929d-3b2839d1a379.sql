-- Create function to automatically create service history on service submission
CREATE OR REPLACE FUNCTION public.create_service_submission_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create history when status changes to submitted from draft or when newly created as submitted
  IF (TG_OP = 'INSERT' AND NEW.status = 'submitted') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'submitted') THEN
    
    INSERT INTO public.service_history (
      service_id,
      service_type,
      actor_id,
      actor_role,
      action,
      notes
    ) VALUES (
      NEW.id,
      NEW.service_type,
      NEW.user_id,
      (SELECT role FROM public.profiles WHERE id = NEW.user_id),
      'Pengajuan disubmit',
      'Usulan layanan telah diajukan dan menunggu persetujuan'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic service history
DROP TRIGGER IF EXISTS trigger_service_submission_history ON public.services;
CREATE TRIGGER trigger_service_submission_history
  AFTER INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.create_service_submission_history();