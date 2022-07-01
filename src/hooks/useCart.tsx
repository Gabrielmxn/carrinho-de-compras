import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}



interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    api.get('stock/')
    .then((response) => setStocks(response.data) )
  }, [])

  const addProduct = async (productId: number) => {
    try {
        await api.get(`/products/${productId}`)
        .then(async response => {
          const stockItem = stocks.find(stock => stock.id === productId);        

          if(cart.find(element => element.id === response.data.id)){
            await updateProductAmount({productId: response.data.id, amount: 1})
            return;
          }else if(stockItem!.amount === 0){
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }

          setCart([...cart, { ...response.data, amount: 1} ])
        })    
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newArray = cart.filter(element => element.id !== productId)
      setCart(newArray);

      return newArray;
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let newArray = [];
      
      const stockItem = stocks.find(stock => stock.id === productId);
      const cartItem = cart.find(cartItem => cartItem.id === productId);
      
      
      if(stockItem!.amount <= 0){
        
        return;
      }
      if(amount > 0){
        if(stockItem!.amount <= cartItem!.amount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        newArray = cart.map(element => {
          if(element.id === productId){
            element.amount += amount;
          }
          return element;
        })
        
        setCart(newArray);
      }else {

        try{
          newArray = cart.map(element => {
            if(element.id === productId){
              element.amount --;
            }
            return element;
          })
          setCart(newArray);
        }catch(e){
          toast.error('Erro na remoção do produto');
        }
         
      }
      
    

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
