export type Item = {
  id: number;
  seller: string;
  token: string;
  price: string; // Precio en Ether (como string)
  quantity: string; // Cantidad en Ether (como string)
};

export type RawItem = {
  seller: string;
  token: string;
  price: bigint; // El contrato devuelve un bigint
  quantity: bigint; // El contrato devuelve un bigint
};
