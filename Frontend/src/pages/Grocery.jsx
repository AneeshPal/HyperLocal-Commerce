
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Chip,
    Divider,
    Paper,
    Grid,
    Drawer,
    Fab,
    Badge,
  } from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import CloseIcon from '@mui/icons-material/Close';

const BLUE = '#0284C7';
const DARK_BLUE = '#0369A1';
const LIGHT_BLUE = '#E0F2FE';

const PRODUCTS = [
  { id: 1, name: 'Potato', unit: '1 kg', price: 30, category: 'Vegetables', emoji: '🥔' },
  { id: 2, name: 'Onion', unit: '1 kg', price: 40, category: 'Vegetables', emoji: '🧅' },
  { id: 3, name: 'Tomato', unit: '500 g', price: 25, category: 'Vegetables', emoji: '🍅' },
  { id: 4, name: 'Banana', unit: '6 pieces', price: 40, category: 'Fruits', emoji: '🍌' },
  { id: 5, name: 'Apple', unit: '4 pieces', price: 100, category: 'Fruits', emoji: '🍎' },
  { id: 6, name: 'Milk', unit: '500 ml', price: 30, category: 'Dairy & Eggs', emoji: '🥛' },
  { id: 7, name: 'Curd', unit: '400 g', price: 35, category: 'Dairy & Eggs', emoji: '🥣' },
  { id: 8, name: 'Eggs', unit: '6 pieces', price: 48, category: 'Dairy & Eggs', emoji: '🥚' },
  { id: 9, name: 'Rice', unit: '1 kg', price: 70, category: 'Staples', emoji: '🍚' },
  { id: 10, name: 'Atta', unit: '1 kg', price: 45, category: 'Staples', emoji: '🌾' },
  { id: 11, name: 'Toor Dal', unit: '500 g', price: 75, category: 'Staples', emoji: '🫘' },
  { id: 12, name: 'Bread', unit: '1 pack', price: 40, category: 'Snacks', emoji: '🍞' },
  { id: 13, name: 'Biscuits', unit: '1 pack', price: 20, category: 'Snacks', emoji: '🍪' },
  { id: 14, name: 'Potato Chips', unit: '1 pack', price: 20, category: 'Snacks', emoji: '🍟' },
  { id: 15, name: 'Tea', unit: '250 g', price: 120, category: 'Staples', emoji: '🍵' },
  { id: 16, name: 'Bottled Water', unit: '1 litre', price: 20, category: 'Beverages', emoji: '💧' },
  { id: 17, name: 'Dishwash Liquid', unit: '500 ml', price: 99, category: 'Household', emoji: '🧴' },
  { id: 18, name: 'Bath Soap', unit: '1 bar', price: 35, category: 'Household', emoji: '🧼' },
];

const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Staples',
  'Snacks',
  'Beverages',
  'Household',
];

export default function Grocery() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PRODUCTS.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const cartItems = useMemo(
    () =>
      PRODUCTS.filter((product) => (cart[product.id] || 0) > 0).map(
        (product) => ({
          ...product,
          quantity: cart[product.id],
        })
      ),
    [cart]
  );

  const itemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const updateQuantity = (productId, change) => {
    setCart((previousCart) => {
      const nextQuantity = (previousCart[productId] || 0) + change;
      const updatedCart = { ...previousCart };

      if (nextQuantity <= 0) {
        delete updatedCart[productId];
      } else {
        updatedCart[productId] = nextQuantity;
      }

      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) => {
      const updatedCart = { ...previousCart };
      delete updatedCart[productId];
      return updatedCart;
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const orderSummary = cartItems
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(', ');

    window.alert(
      `Your grocery cart is ready!\n\nItems: ${orderSummary}\nSubtotal: ₹${subtotal}\n\nOnline checkout is not connected yet.`
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto' }}>
      {/* Page heading */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
        }}
      >
        <IconButton
          aria-label="Back to marketplace"
          onClick={() => navigate('/')}
          sx={{
            border: '1px solid #E2E8F0',
            color: DARK_BLUE,
            flexShrink: 0,
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              fontSize: { xs: 25, md: 32 },
            }}
          >
            Grocery Store
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Daily essentials from your neighbourhood
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search potatoes, milk, fruits..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{
          mb: 2.5,
          bgcolor: '#FFFFFF',
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: BLUE }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Categories */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          overflowX: 'auto',
          pb: 1,
        }}
      >
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            clickable
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? 'filled' : 'outlined'}
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              bgcolor:
                selectedCategory === category ? BLUE : '#FFFFFF',
              color:
                selectedCategory === category ? '#FFFFFF' : '#334155',
              borderColor: '#CBD5E1',
              '&:hover': {
                bgcolor:
                  selectedCategory === category ? DARK_BLUE : LIGHT_BLUE,
              },
            }}
          />
        ))}
      </Box>

      {/* Product grid */}
      <Grid container spacing={2}>
        {filteredProducts.map((product) => {
          const quantity = cart[product.id] || 0;

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={product.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: '0.2s',
                  '&:hover': {
                    borderColor: '#7DD3FC',
                    boxShadow: '0 6px 20px rgba(2,132,199,0.08)',
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 115,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#F0F9FF',
                    fontSize: 56,
                  }}
                >
                  {product.emoji}
                </CardMedia>

                <CardContent
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    '&:last-child': { pb: 1.5 },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {product.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {product.unit}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: DARK_BLUE,
                      fontWeight: 800,
                      mt: 1,
                      mb: 1.5,
                    }}
                  >
                    ₹{product.price}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    {quantity === 0 ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => updateQuantity(product.id, 1)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: DARK_BLUE,
                          borderColor: '#7DD3FC',
                        }}
                      >
                        Add
                      </Button>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #7DD3FC',
                          borderRadius: 2,
                          px: 0.25,
                        }}
                      >
                        <IconButton
                          size="small"
                          aria-label={`Remove one ${product.name}`}
                          onClick={() => updateQuantity(product.id, -1)}
                          sx={{ color: DARK_BLUE }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>

                        <Typography fontWeight={700}>
                          {quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          aria-label={`Add one ${product.name}`}
                          onClick={() => updateQuantity(product.id, 1)}
                          sx={{ color: DARK_BLUE }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredProducts.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            No products found
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Try another search or category.
          </Typography>

          <Button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
            }}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Clear filters
          </Button>
        </Paper>
      )}

      {/* Floating cart icon only */}
      <Fab
        aria-label={`Open cart, ${itemCount} items`}
        onClick={() => setCartOpen(true)}
        sx={{
          position: 'fixed',
          top: 165,
          right: 24,
          zIndex: 1200,
          width: 58,
          height: 58,
          minHeight: 58,
          bgcolor: BLUE,
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
          '&:hover': {
            bgcolor: DARK_BLUE,
          },
        }}
      >
        <Badge
          badgeContent={itemCount}
          color="error"
          max={99}
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 700,
              right: -7,
              top: -5,
            },
          }}
        >
          <ShoppingBasketOutlinedIcon />
        </Badge>
      </Fab>

      {/* Wider right-side cart drawer */}
      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: 460,
              md: 500,
            },
            maxWidth: '100vw',
            p: {
              xs: 2.5,
              sm: 3.5,
            },
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Cart header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <ShoppingBasketOutlinedIcon
            sx={{ color: BLUE, fontSize: 28 }}
          />

          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ flexGrow: 1 }}
          >
            Your Cart ({itemCount})
          </Typography>

          <IconButton
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Cart items */}
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: 52, mb: 1 }}>
              🛒
            </Typography>

            <Typography fontWeight={700} variant="h6">
              Your cart is empty
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Add some products to get started.
            </Typography>

            <Button
              onClick={() => setCartOpen(false)}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Continue shopping
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
              {cartItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2,
                    px: 0.5,
                    minWidth: 0,
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#F0F9FF',
                      borderRadius: 2.5,
                      fontSize: 30,
                    }}
                  >
                    {item.emoji}
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      fontWeight={700}
                      sx={{ fontSize: 16, mb: 0.5 }}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      ₹{item.price} · {item.unit}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        mt: 1.25,
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => updateQuantity(item.id, -1)}
                        sx={{
                          border: '1px solid #CBD5E1',
                          width: 30,
                          height: 30,
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 17 }} />
                      </IconButton>

                      <Typography fontWeight={700}>
                        {item.quantity}
                      </Typography>

                      <IconButton
                        size="small"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateQuantity(item.id, 1)}
                        sx={{
                          border: '1px solid #CBD5E1',
                          width: 30,
                          height: 30,
                        }}
                      >
                        <AddIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      textAlign: 'right',
                      flexShrink: 0,
                      minWidth: 62,
                    }}
                  >
                    <Typography fontWeight={700}>
                      ₹{item.price * item.quantity}
                    </Typography>

                    <IconButton
                      size="small"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeFromCart(item.id)}
                      sx={{
                        mt: 1,
                        color: '#64748B',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🗑️</span>
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Cart totals and checkout */}
            <Box
              sx={{
                mt: 'auto',
                pt: 3,
                pb: 0.5,
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1.5,
                }}
              >
                <Typography color="text.secondary">
                  Items ({itemCount})
                </Typography>

                <Typography fontWeight={600}>
                  ₹{subtotal}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography fontWeight={800} fontSize={17}>
                  Subtotal
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight={800}
                  color={DARK_BLUE}
                >
                  ₹{subtotal}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5 }}
              >
                Delivery charges, if any, are not included.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={handleCheckout}
                sx={{
                  py: 1.5,
                  bgcolor: BLUE,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  '&:hover': {
                    bgcolor: DARK_BLUE,
                  },
                }}
              >
                Proceed to Checkout
              </Button>

              <Button
                fullWidth
                onClick={() => setCart({})}
                sx={{
                  mt: 1.5,
                  py: 1,
                  color: '#64748B',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Clear cart
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
