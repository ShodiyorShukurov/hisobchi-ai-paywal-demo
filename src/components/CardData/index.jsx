import { useEffect } from 'react';
import MaskedInput from 'react-text-mask';
import { message } from 'antd';
import './ObunaPay.css';
import { useNavigate, useParams } from 'react-router-dom';
import atmos from '../../assets/atmos.svg';

const ObunaPay = () => {
  const { id } = useParams();
  localStorage.setItem('obunaPay', id);
  const navigate = useNavigate();

  const validateCardNumber = (value) => {
    return value && value.length === 16;
  };

  const validateExpiryDate = (value) => {
    return value && /^(0[1-9]|1[0-2])\/(\d{2})$/.test(value);
  };

  const validateForm = () => {
    const cardNumber = document
      .querySelector('.card-number')
      .value.replace(/[^0-9]/g, '');
    const expiryDate = document.querySelector('.card-expiry').value;

    const cardValid = validateCardNumber(cardNumber);
    const expiryValid = validateExpiryDate(expiryDate);

    if (!cardValid) {
      message.error("Karta raqamini to'g'ri kiriting!");
    }

    if (!expiryValid) {
      message.error(
        "Kartangizning amal qilish muddatini to'g'ri kiriting! (MM/YY formatida)"
      );
    }

    return cardValid && expiryValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    const MainButton = window.Telegram.WebApp.MainButton;

    MainButton.showProgress();
    MainButton.disable();

    const cardNumber = document
      .querySelector('.card-number')
      .value.replace(/[^0-9]/g, '');
    const expiryDate = document.querySelector('.card-expiry').value;
    localStorage.setItem('expiryDate', expiryDate);
    localStorage.setItem('cardNumber', cardNumber);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/add-card/` +
          localStorage.getItem('obunaPay'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            card_number: cardNumber,
            expiry: expiryDate,
          }),
        }
      );

      const data = await response.json();

      if (data.status == 400) {
        message.error('Iltimos, nomerga ulangan kartani kiriting!');
      } else if (data.status == 200) {
        localStorage.setItem('transaction_id', data.transaction_id);
        localStorage.setItem('phone', data.phone);
        navigate('/sms-verification');
      } else if (data.description == 'У партнера имеется указанная карта') {
        message.error("Bu karta oldin qo'shilgan boshqa karta kiriting!");
      } else if (data.description == 'Неправильные параметры') {
        message.error("Karta ma'lumotlarini noto'g'ri!");
      }
    } catch (error) {
      console.error('Error:', error);
      message.error(error.message);
    } finally {
      MainButton.hideProgress();
      MainButton.enable();
    }
  };

  useEffect(() => {
    const MainButton = window.Telegram?.WebApp?.MainButton;

    if (MainButton) {
      const handleClick = () => {
        handleSubmit();
      };

      MainButton.setText('Tasdiqlash').show();
      MainButton.onClick(handleClick);

      return () => {
        MainButton.offClick(handleClick);
        MainButton.hide();
      };
    } else {
      console.log('Telegram WebApp SDK yuklanmagan');
    }
  }, []);


  const handleCardPaste = (e) => {
  e.preventDefault();
  const pasted = e.clipboardData.getData('Text');
  const digitsOnly = pasted.replace(/\D/g, ''); // Faqat raqamlar
  const formatted = digitsOnly
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

  // Inputga qiymatni qo‘lda o‘rnatish
  const input = e.target;
  input.value = formatted;

  // Agar siz controlled component ishlatayotgan bo‘lsangiz:
  // setCardNumber(formatted);
};

  return (
    <div className="container">
      <div className="form-section">
        <h1 className="title padding">
          Bank kartasi ma&apos;lumotlarini kiriting
        </h1>
        <form>
          <MaskedInput
            mask={[
              /\d/,
              /\d/,
              /\d/,
              /\d/,
              ' ',
              /\d/,
              /\d/,
              /\d/,
              /\d/,
              ' ',
              /\d/,
              /\d/,
              /\d/,
              /\d/,
              ' ',
              /\d/,
              /\d/,
              /\d/,
              /\d/,
            ]}
            className="card-number"
            placeholder="0000 0000 0000 0000"
            required
            inputMode="numeric"
            onPaste={handleCardPaste}
          />
          <MaskedInput
            mask={[/\d/, /\d/, '/', /\d/, /\d/]}
            className="card-expiry"
            placeholder="MM/YY"
            required
            inputMode="numeric"
          />
        </form>
      </div>
      <h2>Eslatmalar</h2>
      <p>- To'lov UzCard va Humo kartalari orqali amalga oshiriladi.</p>

      <p className="medium">
        - Karta ma'lumotlari Atmos to'lov tizimida xavfsiz saqlanadi. To'lovlar
        haqqoniyligi kafolatlanadi.{' '}
        <a href="https://atmos.uz/documents" target="_blank">
          Oferta
        </a>
      </p>
      <p>
        - Yillik tarif harid qilinganda, karta ma'lumotlarini kiritish talab
        etilmaydi.
      </p>

      <div className="images">
        {/* <img
          className="logo transparent"
          src={logo}
          alt="logo"
          width={80}
          height={80}
        /> */}
        <img
          className="transparent"
          src={atmos}
          alt="atmos"
          width={80}
          height={80}
        />
      </div>

      <p className="help transparent">
        To'lov operatori:{' '}
        <a href="https://atmos.uz" target="_blank">
          Atmos.uz
        </a>{' '}
        to'lov tizimi
      </p>
    </div>
  );
};

export default ObunaPay;
