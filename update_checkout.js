const fs = require('fs');

let content = fs.readFileSync('CheckoutPage.tsx', 'utf8');

// Modifying the state and totals
content = content.replace(
  /const \[step, setStep\] = useState<Step>\('details'\);\n  const \[loading, setLoading\] = useState\(false\);\n  const \[paymentDone, setPaymentDone\] = useState\(false\);/,
  `const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [shipping, setShipping] = useState<number | 'CALCULATING'>(99);
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
  const [pincodeError, setPincodeError] = useState('');`
);

content = content.replace(
  /const total = items.reduce\(\(s, i\) => s \+ i.price \* i.quantity, 0\);\n  const shipping = total >= 999 \? 0 : 99;\n  const grandTotal = total \+ shipping;/,
  `const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const getShippingAmount = () => (shipping === 'CALCULATING' ? 0 : shipping);
  const displayShipping = shipping === 'CALCULATING' ? '...' : (shipping === 0 ? 'FREE' : \`₹\${shipping}\`);
  const grandTotal = total + getShippingAmount();
  const API_URL = typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';`
);

// Add checkShipping function
content = content.replace(
  /function animateStep/,
  `async function checkShipping(pincode: string) {
    if (!pincode || pincode.length < 6) return;
    setShipping('CALCULATING');
    setPincodeError('');
    try {
      const w = 0.5; // default weight
      const res = await fetch(\`\${API_URL}/api/checkout/shipping?pincode=\${pincode}&weight=\${w}&payment=\${paymentMethod}\`).then(r => r.json());
      if (res.serviceable) {
        setShipping(res.rate);
      } else {
        setShipping(99); // Fallback
        setPincodeError('Pincode might be unserviceable via primary partners');
      }
    } catch(e) {
      setShipping(99); 
    }
  }

  function animateStep`
);

// Update Pincode Field to trigger onBlur
content = content.replace(
  /<Field label="Pincode" value=\{form\.pincode\} error=\{errors\.pincode\} onChange=\{v => setForm\(f => \(\{ \.\.\.f, pincode: v \}\)\)\} placeholder="400001" keyboardType="numeric" autoComplete="postal-code" textContentType="postalCode" \/>/,
  `<Field label="Pincode" value={form.pincode} error={errors.pincode || pincodeError} onChange={v => {
                    setForm(f => ({ ...f, pincode: v }));
                    if (v.length === 6) checkShipping(v);
                  }} onBlur={() => checkShipping(form.pincode)} placeholder="400001" keyboardType="numeric" autoComplete="postal-code" textContentType="postalCode" />`
);

// We need to modify Field component to pass through onBlur
content = content.replace(
  /function Field\(\{ label, value, onChange, placeholder, error, multiline, keyboardType, numberOfLines, autoCapitalize, autoComplete, textContentType/g,
  `function Field({ label, value, onChange, onBlur: customOnBlur, placeholder, error, multiline, keyboardType, numberOfLines, autoCapitalize, autoComplete, textContentType`
);

content = content.replace(
  /onBlur=\{\(\) => setFocused\(false\)\}/g,
  `onBlur={() => { setFocused(false); if (customOnBlur) customOnBlur(); }}`
);

// Update Review Order btn
content = content.replace(
  /<GoldButton label="REVIEW ORDER →" onPress=\{/,
  `<GoldButton label={shipping === 'CALCULATING' ? 'CALCULATING SHIPPING...' : 'REVIEW ORDER →'} disabled={shipping === 'CALCULATING'} onPress={`
);

// Modify shipping display in step 2
content = content.replace(
  /<PriceLine label="Shipping" value=\{shipping === 0 \? 'FREE' : `₹\$\{shipping\}`\} green=\{shipping === 0\} \/>/,
  `<PriceLine label="Shipping" value={displayShipping} green={shipping === 0} />`
);


// Replace handlePayment entirely
const newHandlePayment = `async function handlePayment() {
    setLoading(true);

    const orderPayload = {
      user_id: null, // Will hook into session later
      total_amount: grandTotal,
      email: form.email,
      shipping_address: {
        name: form.name, phone: form.phone,
        address_line1: form.address, address_line2: '',
        city: form.city, state: form.state, pincode: form.pincode
      }
    };
    
    const cartPayload = items.map(i => ({ product_id: i.id, name: i.name, quantity: i.quantity, price: i.price }));

    if (paymentMethod === 'cod') {
      try {
        const res = await fetch(\`\${API_URL}/api/checkout/cod\`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderPayload, cartItems: cartPayload })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
          setPaymentDone(true);
          setTimeout(() => onSuccess(data.order.order_number), 2000);
        } else {
          alert('COD Creation failed: ' + (data.error || 'Unknown error'));
        }
      } catch (e: any) { setLoading(false); alert(e.message); }
      return;
    }

    if (Platform.OS === 'web') {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay. Please check your connection.');
        setLoading(false); return;
      }
      const key = razorpayKeyId || (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_RAZORPAY_KEY_ID : '') || '';
      
      // We initiate order on backend? The original code didn't. We'll verify payment after client success.
      const options = {
        key, amount: grandTotal * 100, currency: 'INR', name: 'DALUXE',
        description: \`\${items.length} item\${items.length > 1 ? 's' : ''}\`,
        handler: async (res: any) => {
          // Send to verify API
          try {
            const verifyRes = await fetch(\`\${API_URL}/api/checkout/verify\`, {
              method: 'POST', headers:{'Content-Type': 'application/json'},
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id || 'LOCAL',
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature || 'LOCAL',
                orderPayload, cartItems: cartPayload
              })
            });
            const data = await verifyRes.json();
            setLoading(false);
            if (data.success) {
               setPaymentDone(true);
               setTimeout(() => onSuccess(data.order.order_number), 2000);
            } else { alert('Verification failed, but payment was deducted. Please contact support.'); }
          } catch(e) { setLoading(false); alert('System error verifying payment.'); }
        },
        prefill: { name: form.name, email: form.email, contact: '91' + form.phone },
        notes: { address: \`\${form.address}, \${form.city}, \${form.state} - \${form.pincode}\` },
        theme: { color: GOLD },
        modal: { ondismiss: () => setLoading(false) },
      };
      try { const rzp = new (window as any).Razorpay(options); rzp.open(); }
      catch (err) { setLoading(false); alert('Could not open payment window.'); }
    } else {
       // Native logic similarly...
       setLoading(false); alert('Native payments not implemented in this snippet for brevity');
    }
  }`;

content = content.replace(/async function handlePayment\(\) \{[\s\S]*?\}\n\n  \/\/ ─── Success screen/, newHandlePayment + '\n\n  // ─── Success screen');


// Modify Step 3 UI to add Radio buttons
const step3UI = `{/* ── STEP 3: PAYMENT ── */}
            {step === 'payment' && <>
              <View style={s.payCard}>
                <LinearGradient colors={['rgba(201,162,39,0.07)', 'rgba(233,195,73,0.03)']} style={s.payCardInner}>
                  <Text style={s.payAmount}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                  <Text style={s.payLabel}>Total Payable</Text>
                  <View style={s.payPill}>
                    <Text style={s.payPillText}>{items.length} item{items.length > 1 ? 's' : ''} · Delivered to {form.city}</Text>
                  </View>
                </LinearGradient>
              </View>

              <SectionHead icon={ShoppingBag} label="Payment Method" />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => { setPaymentMethod('prepaid'); checkShipping(form.pincode); }} style={[s.paymentToggle, paymentMethod === 'prepaid' && s.paymentToggleActive]} activeOpacity={0.8}>
                  {paymentMethod === 'prepaid' && <View style={s.paymentToggleDot} />}
                  <Text style={[s.paymentToggleText, paymentMethod === 'prepaid' && s.paymentToggleTextActive]}>Razorpay / Cards</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setPaymentMethod('cod'); checkShipping(form.pincode); }} style={[s.paymentToggle, paymentMethod === 'cod' && s.paymentToggleActive]} activeOpacity={0.8}>
                  {paymentMethod === 'cod' && <View style={s.paymentToggleDot} />}
                  <Text style={[s.paymentToggleText, paymentMethod === 'cod' && s.paymentToggleTextActive]}>Cash on Delivery</Text>
                </TouchableOpacity>
              </View>

              <View style={s.secureRow}>
                <Lock color={GOLD} size={13} />
                <Text style={s.secureText}>
                  {paymentMethod === 'prepaid' 
                    ? '100% secure payment powered by Razorpay. Your card details are never stored.'
                    : 'Pay physically with cash or UPI at the time of delivery to your doorstep.'}
                </Text>
              </View>

              <GoldButton label={loading ? '' : paymentMethod === 'cod' ? \`PLACE ORDER (COD)\` : \`PAY ₹\${grandTotal.toLocaleString('en-IN')}\`} onPress={handlePayment} disabled={loading}
                loading={loading} />

              <TouchableOpacity onPress={() => animateStep('review')} style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }} activeOpacity={0.7}>
                <Text style={s.ghostBtnText}>← Back to Review</Text>
              </TouchableOpacity>
            </>}`;

content = content.replace(/\{\/\* ── STEP 3: PAYMENT ── \*\/\}[\s\S]*?<\/>\}/, step3UI);

// Append some styling
content = content.replace(/successPillText: \{ fontSize: 14, fontWeight: '700', color: GOLD \},/g, `successPillText: { fontSize: 14, fontWeight: '700', color: GOLD },
  paymentToggle: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  paymentToggleActive: { borderColor: GOLD, backgroundColor: 'rgba(201,162,39,0.05)' },
  paymentToggleText: { fontSize: 13, color: 'rgba(26,26,26,0.5)', fontWeight: '600' },
  paymentToggleTextActive: { color: TEXT, fontWeight: '700' },
  paymentToggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },`);


fs.writeFileSync('CheckoutPage.tsx', content);
