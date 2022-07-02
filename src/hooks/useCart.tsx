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
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {
        await api.get(`/products/${productId}`)
        .then( async response => {     
          const cartItem = cart.find(element => element.id === response.data.id)
          if(cartItem){
            updateProductAmount({productId: response.data.id, amount: (cartItem.amount + 1)})
            return;
          }
          else {
            await api.get(`/stock/${productId}`).then((responseStock) => {
              if(responseStock.data.amount === 0){
                toast.error('Quantidade solicitada fora de estoque');
                return;
              }else{
                const newArray = [...cart, { ...response.data, amount: 1} ]
                setCart(newArray)
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
              }
            })
          }
        })
      } 
        catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async ( productId: number) => {
    try {
        const isProduct = cart.find(element => element.id === productId )
        if(isProduct === undefined) {
          throw new Error();
        }
        const newArray = cart.filter(element => element.id !== productId)
        setCart(newArray);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        const isProduct = cart.find(element => element.id === productId )
        if(isProduct === undefined) {
          throw new Error();
        }
        if( amount !== 0){
       
          await api.get(`/stock/${productId}`).then((responseStock) =>{
            
              if(responseStock.data.amount > 0){
                if(responseStock.data.amount < amount){
                  toast.error('Quantidade solicitada fora de estoque');
                  return;
                }
                   const newArray = cart.map(element => {
                     if(element.id === productId){
                       element.amount = amount;
                     }
                     return element;
                   })
                   console.log(newArray)
                   setCart(newArray);    
                   localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
           
                
             }else{
              toast.error('Quantidade solicitada fora de estoque');
             }
           
            
           }).catch (() => {
             toast.error('Quantidade solicitada fora de estoque');
           })
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
