import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';

const ReportPage: React.FC = () => {
  const { keycloak, initialized } = useKeycloak();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[] | null>(null);

  const downloadReport = async () => {
    if (!keycloak?.token) {
      setError('Не авторизован');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await keycloak.updateToken(10);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (!response.ok) {
        let message = `Ошибка ${response.status}`;
        try {
          const data = await response.json();
          message += `: ${data.detail || JSON.stringify(data)}`;
        } catch {
          const text = await response.text();
          message += `: ${text}`;
        }
        throw new Error(message);
      }

      const data = await response.json();
      setReports(data.reports || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return <div>Загрузка...</div>;
  }

  if (!keycloak.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <button
          onClick={() => keycloak.login()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Шапка с кнопкой выхода */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Выйти
        </button>
      </div>

      {/* Основное содержимое */}
      <div className="flex flex-col items-center justify-center flex-grow p-4">
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Отчеты об использовании</h1>
          
          <div className="flex justify-center">
            <button
              onClick={downloadReport}
              disabled={loading}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Формирование отчета...' : 'Скачать отчет'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {reports && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full table-auto border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border px-4 py-2">Устройство</th>
                    <th className="border px-4 py-2">ID отчета</th>
                    <th className="border px-4 py-2">Значение</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={i}>
                      <td className="border px-4 py-2">{r.device}</td>
                      <td className="border px-4 py-2">{r.reportId}</td>
                      <td className="border px-4 py-2">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;