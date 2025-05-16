import { useEffect, useRef, useState } from 'react';
import { Input, message, notification } from 'antd';
import '../CardData/ObunaPay.css';
import logo from '../../assets/hisobchi.svg';
import atmos from '../../assets/atmos.svg';
import left from '../../assets/Left Icon.svg';
import { NavLink } from 'react-router-dom';
import OTPInput from 'react-otp-input';

const ConfirmationCode = () => {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const resendCode = async () => {
    const MainButton = window.Telegram.WebApp.MainButton;

    MainButton.showProgress();
    MainButton.disable();

    try {
      const response = await fetch(
        'https://bot.admob.uz/api/v1/add-card/' +
          localStorage.getItem('obunaPay'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            card_number: localStorage.getItem('cardNumber'),
            expiry: localStorage.getItem('expiryDate'),
          }),
        }
      );

      const data = await response.json();

      if (data.status == 400) {
        message.error('Iltimos, nomerga ulangan kartani kiriting!');
      } else if (data.status == 200) {
        localStorage.setItem('transaction_id', data.transaction_id);
        localStorage.setItem('phone', data.phone);
        // navigate('/sms-verification');
      } else if (data.description == 'У партнера имеется указанная карта') {
        message.error("Bu karta oldin qo'shilgan boshqa karta kiriting!");
      }
    } catch (error) {
      console.error('Error:', error);
      // message.error('Iltimos, boshqa karta kiriting!');
    } finally {
      MainButton.hideProgress();
      MainButton.enable();
    }
    setTimeLeft(60);
    setShowResend(false);
  };

  const openNotificationWithIcon = (type, message) => {
    notification[type]({
      message: type,
      description: message,
    });
  };

  const handleConfirm = async (code) => {
    const MainButton = window.Telegram.WebApp.MainButton;

    MainButton.showProgress();
    MainButton.disable();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/opt/` + localStorage.getItem('obunaPay'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            transaction_id: localStorage.getItem('transaction_id'),
          }),
        }
      );

      const data = await response.json();

      if (data.status === 200) {
        window.Telegram.WebApp.close();
      } else {
        openNotificationWithIcon('error', 'Boshqa kartani kiriting!');
      }
    } catch (error) {
      console.log(error);
      openNotificationWithIcon(
        'error',
        "Xatolik yuz berdi, qayta urinib ko'ring!"
      );
    } finally {
      MainButton.hideProgress();
      MainButton.enable();
    }
  };

  const validateCode = (code) => {
    return code && code.length === 6;
  };

  useEffect(() => {
    if (window.Telegram) {
      const MainButton = window.Telegram.WebApp.MainButton;

      MainButton.setText('Tasdiqlash').show();

      const onClickHandler = () => {
        if (validateCode(code)) {
          handleConfirm(code);
        } else {
          message.error(
            'Iltimos telefon raqamingizga borgan 6 xonali kodni kiriting!'
          );
        }
      };

      MainButton.onClick(onClickHandler);

      return () => {
        MainButton.offClick(onClickHandler);
        MainButton.hide();
      };
    }
  }, [code]);

  const inputRef = useRef(null); // Inputga referens

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('Text')
      .replace(/\D/g, '')
      .slice(0, 6);
    setCode(pasted);

    // Tanlashni olib tashlash va kursor pozitsiyasini oxiriga qo'yish
    setTimeout(() => {
      if (inputRef.current) {
        const input = inputRef.current.input;
        input.setSelectionRange(pasted.length, pasted.length); // Kursor oxiriga o'tadi
      }
    }, 0);
  };

  return (
    <div className="container">
      <div className="padding sms">
        <NavLink to={`/` + localStorage.getItem('obunaPay')}>
          <img src={left} alt="left" />
          <span>Ortga</span>
        </NavLink>
        <h1
          style={{ textAlign: 'center', margin: '0 auto' }}
          className="title "
        >
          Tasdiqlash kodi
        </h1>
      </div>

      <form>
       {/* <Input.OTP
          ref={inputRef}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputMode="numeric"
          formatter={(s) => s.toUpperCase()}
          onPaste={handlePaste}
          className="custom-otp-input"
          style={{ fontSize: '16px' }}
        />*/}

         <OTPInput
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          numInputs={6}
          inputStyle={{
            padding: '2px 6px',
            backgroundColor: '#FFF',
            borderRadius: '8px',
            width: '45px',
            height: '48px',
            outline: 'none',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '24px',
            // border: otpError ? '2px solid #FF3B30' : 'none',
          }}
          placeholder="------"
          renderSeparator={
            <span style={{ width: '10px', display: 'inline-block' }}></span>
          }
          renderInput={(props) => <input {...props} inputMode="numeric" />}
        />
      </form>

      {localStorage.getItem('phone') && (
        <p className="phone-number">
          {'+' +
            localStorage.getItem('phone').slice(0, 5) +
            '*****' +
            localStorage.getItem('phone').slice(-2)}{' '}
          ushbu raqamga tasdiqlash kodi jo'natildi
        </p>
      )}

      {!showResend ? (
        <button className="button">{formatTime(timeLeft)}</button>
      ) : (
        <button
          onClick={() => {
            resendCode();
            setCode('');
          }}
          className="button"
        >
          Qayta kodni olish
        </button>
      )}

      <div className="images">
        {/* <img
          className="logo transparent"
          src={logo}
          alt="logo"
          width={80}
          height={80}
        />*/}
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
    </div>
  );
};

export default ConfirmationCode;
