-- 1. institution_positions: require verified institution for UPDATE/DELETE and pin institution_id
DROP POLICY IF EXISTS "institution staff update positions" ON public.institution_positions;
CREATE POLICY "institution staff update positions"
ON public.institution_positions FOR UPDATE TO authenticated
USING (
  public.is_institution_member(institution_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_positions.institution_id AND i.verified = true)
)
WITH CHECK (
  public.is_institution_member(institution_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_positions.institution_id AND i.verified = true)
);

DROP POLICY IF EXISTS "institution staff delete positions" ON public.institution_positions;
CREATE POLICY "institution staff delete positions"
ON public.institution_positions FOR DELETE TO authenticated
USING (
  public.is_institution_member(institution_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_positions.institution_id AND i.verified = true)
);

-- 2. institutions: staff may edit their institution but may not change ownership or verification
DROP POLICY IF EXISTS "institution staff update" ON public.institutions;
CREATE POLICY "institution staff update"
ON public.institutions FOR UPDATE TO authenticated
USING (public.is_institution_member(id, auth.uid()))
WITH CHECK (
  public.is_institution_member(id, auth.uid())
  AND verified = (SELECT i2.verified FROM public.institutions i2 WHERE i2.id = institutions.id)
  AND owner_id = (SELECT i2.owner_id FROM public.institutions i2 WHERE i2.id = institutions.id)
);