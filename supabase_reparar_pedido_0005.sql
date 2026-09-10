-- =====================================================================
-- SCRIPT DE RECUPERAÇÃO: Inserir itens do Pedido #0005
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =====================================================================

DO $$
DECLARE
  v_venda_id UUID;
  v_prod1_id UUID;
  v_prod2_id UUID;
  v_prod3_id UUID;
BEGIN
  -- 1. Localiza a venda do Pedido #0005 (pelo número 5 ou pelos valores R$ 559,80 / R$ 622,00)
  SELECT id INTO v_venda_id
  FROM public.vendas
  WHERE numero = 5 
     OR (valor_total = 559.80 AND subtotal = 622.00)
     OR valor_total = 559.80
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_venda_id IS NULL THEN
    RAISE NOTICE 'Pedido #0005 não encontrado na tabela de vendas.';
    RETURN;
  END IF;

  RAISE NOTICE 'Venda encontrada: %', v_venda_id;

  -- 2. Limpa quaisquer itens residuais para esta venda para não duplicar
  DELETE FROM public.vendas_itens WHERE venda_id = v_venda_id;

  -- 3. Localiza os 3 produtos por nome
  SELECT id INTO v_prod1_id FROM public.produtos WHERE nome ILIKE '%SUBTRATO%ORQU%MIX%500%' LIMIT 1;
  SELECT id INTO v_prod2_id FROM public.produtos WHERE nome ILIKE '%SUBTRATO%ORQU%PREMIUM%1%5%' LIMIT 1;
  SELECT id INTO v_prod3_id FROM public.produtos WHERE nome ILIKE '%TERRA%VEGETAL%25%' LIMIT 1;

  -- Se não achar por termo com erro de digitação, tenta por aproximação
  IF v_prod1_id IS NULL THEN
    SELECT id INTO v_prod1_id FROM public.produtos WHERE nome ILIKE '%ORQU%MIX%500%' LIMIT 1;
  END IF;
  IF v_prod2_id IS NULL THEN
    SELECT id INTO v_prod2_id FROM public.produtos WHERE nome ILIKE '%ORQU%PREMIUM%1%5%' OR nome ILIKE '%ORQU%PREMIUM%' LIMIT 1;
  END IF;
  IF v_prod3_id IS NULL THEN
    SELECT id INTO v_prod3_id FROM public.produtos WHERE nome ILIKE '%TERRA%VEGETAL%' LIMIT 1;
  END IF;

  -- 4. Insere os 3 itens na tabela vendas_itens:
  -- Item 1: 20x SUBTRATO ORQUÍDEAS MIX 500 GR (R$ 7,30 un = R$ 146,00)
  IF v_prod1_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod1_id, 20, 7.30, 146.00);
    RAISE NOTICE 'Item 1 (SUBTRATO ORQUÍDEAS MIX 500 GR) inserido com sucesso!';
  ELSE
    RAISE NOTICE 'Aviso: Produto SUBTRATO ORQUÍDEAS MIX 500 GR não encontrado na tabela produtos.';
  END IF;

  -- Item 2: 20x SUBTRATO ORQUÍDEAS PREMIUM 1/5 LITROS (R$ 9,90 un = R$ 198,00)
  IF v_prod2_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod2_id, 20, 9.90, 198.00);
    RAISE NOTICE 'Item 2 (SUBTRATO ORQUÍDEAS PREMIUM 1/5 LITROS) inserido com sucesso!';
  ELSE
    RAISE NOTICE 'Aviso: Produto SUBTRATO ORQUÍDEAS PREMIUM 1/5 LITROS não encontrado na tabela produtos.';
  END IF;

  -- Item 3: 20x TERRA VEGETAL 25 KILOS (R$ 13,90 un = R$ 278,00)
  IF v_prod3_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod3_id, 20, 13.90, 278.00);
    RAISE NOTICE 'Item 3 (TERRA VEGETAL 25 KILOS) inserido com sucesso!';
  ELSE
    RAISE NOTICE 'Aviso: Produto TERRA VEGETAL 25 KILOS não encontrado na tabela produtos.';
  END IF;

  -- 5. Garante que os valores da venda estejam exatos
  UPDATE public.vendas
  SET 
    subtotal = 622.00,
    desconto_valor = 62.20,
    desconto_percentual = 10,
    valor_total = 559.80
  WHERE id = v_venda_id;

  RAISE NOTICE 'Sucesso! Itens do Pedido #0005 restaurados e valores confirmados.';
END $$;
