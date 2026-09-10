-- =====================================================================
-- SCRIPT DE RECUPERAÇÃO: Inserir itens do Pedido #0006
-- Execute este script no SQL Editor do Supabase se quiser restaurar os itens
-- =====================================================================

DO $$
DECLARE
  v_venda_id UUID;
  v_prod1_id UUID;
  v_prod2_id UUID;
  v_prod3_id UUID;
BEGIN
  -- 1. Localiza a venda do Pedido #0006
  SELECT id INTO v_venda_id
  FROM public.vendas
  WHERE numero = 6 
     OR (valor_total = 250.95)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_venda_id IS NULL THEN
    RAISE NOTICE 'Pedido #0006 não encontrado na tabela de vendas.';
    RETURN;
  END IF;

  RAISE NOTICE 'Venda encontrada: %', v_venda_id;

  -- 2. Limpa quaisquer itens residuais para não duplicar
  DELETE FROM public.vendas_itens WHERE venda_id = v_venda_id;

  -- 3. Localiza os 3 produtos por código ou nome
  SELECT id INTO v_prod1_id FROM public.produtos WHERE codigo = '04' OR codigo = '4' OR nome ILIKE '%AREIA DE RIO%' LIMIT 1;
  SELECT id INTO v_prod2_id FROM public.produtos WHERE codigo = '05' OR codigo = '5' OR nome ILIKE '%ARGILA%500%' LIMIT 1;
  SELECT id INTO v_prod3_id FROM public.produtos WHERE codigo = '06' OR codigo = '6' OR nome ILIKE '%ARGILA%2%' LIMIT 1;

  -- 4. Insere os 3 itens do Pedido #0006:
  -- Item 1: 23x AREIA DE RIO (R$ 10,00 un = R$ 230,00)
  IF v_prod1_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod1_id, 23, 10.00, 230.00);
  END IF;

  -- Item 2: 4x ARGILA EXPANDIDA /500GR (R$ 2,99 un = R$ 11,96)
  IF v_prod2_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod2_id, 4, 2.99, 11.96);
  END IF;

  -- Item 3: 1x ARGILA EXPANDIDA 2 KILOS (R$ 8,99 un = R$ 8,99)
  IF v_prod3_id IS NOT NULL THEN
    INSERT INTO public.vendas_itens (venda_id, produto_id, quantidade, valor_unitario, subtotal)
    VALUES (v_venda_id, v_prod3_id, 1, 8.99, 8.99);
  END IF;

  -- 5. Atualiza o total da venda e subtotal para R$ 250,95
  UPDATE public.vendas
  SET valor_total = 250.95,
      subtotal = 250.95,
      desconto_valor = 0
  WHERE id = v_venda_id;

  RAISE NOTICE 'Itens do Pedido #0006 restaurados com sucesso!';
END $$;
