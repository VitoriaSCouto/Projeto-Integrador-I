import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaWheelchair, FaUtensils } from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";

export default function DetalhesAbrigo() {
  const { id } = useParams(); // Captura o :id da URL
  const navigate = useNavigate();

// IMPORTAÇÃO DOS DOIS CSS (Global e o Específico de Detalhes)
import "../pg_adm/style.css";      
import './DetalhesAbrigos.css';

export default function DetalhesAbrigo() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Estados necessários para o funcionamento dos inputs e formulário
  const [status, setStatus] = useState('com_vagas');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [imagem, setImagem] = useState(null);
  const [infraestrutura, setInfraestrutura] = useState({
    pets: false,
    acessibilidade: false,
    cozinha: false
  });

  // Funções de manipulação do formulário
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setInfraestrutura(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagem(URL.createObjectURL(file));
    }
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    console.log("Salvando dados...", { status, endereco, telefone, infraestrutura, imagem });
  };

  return (
    <div className="dashboard">
      
      {/* SIDEBAR PRINCIPAL - IDÊNTICA AO SEGUNDO CÓDIGO */}
      <aside className="sidebar">
        <ul>
          <a href="/pg_adm">
            <li><FaHome className="icon" /> Home</li>
          </a>
          <a href="/abrigo">
            <li className="active"><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a href="/listar_vitimas">
            <li><FaUser className="icon" /> Vítimas</li>
          </a>
          <li><FaDonate className="icon" /> Doações</li>
          <li><FaMapPin className="icon" /> Região Afetada</li>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>
      </aside>

      {/* CONTEÚDO PRINCIPAL - USANDO A CLASSE .MAIN DO SEGUNDO CÓDIGO */}
      <main className="main">
        
        {/* Cabeçalho superior no mesmo padrão */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Abrigos &gt; <span>Vizualize ou Edite</span></p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>Detalhes / Editar Abrigo</h1>
          </div>
          <div className="top-icons">
            <img src="src/assets/logo.png" width="80px" alt="Logo" />
          </div>
        </header>

        {/* Formulário envelopado de forma limpa */}
        <form onSubmit={handleSalvar} className="cadastro-form-container">
          
          {/* Coluna da Esquerda: Informações e Infraestrutura */}
          <div className="form-column-left">
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select 
                id="status" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className={`select-status ${status}`}
              >
                <option value="com_vagas">Com vagas</option>
                <option value="sem_vagas">Sem vagas</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaMapMarkerAlt /> Endereço</label>
              <input 
                type="text" 
                placeholder="Digite o endereço completo..." 
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <input 
                type="text" 
                placeholder="(XX) XXXXX-XXXX" 
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Infraestrutura</h3>
              
              <label className="checkbox-card">
                <input 
                  type="checkbox" 
                  name="pets" 
                  checked={infraestrutura.pets} 
                  onChange={handleCheckboxChange} 
                />
                <div className="checkbox-content">
                  <FaDog className="icon" />
                  <span>Pets Bem-Vindos</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input 
                  type="checkbox" 
                  name="acessibilidade" 
                  checked={infraestrutura.acessibilidade} 
                  onChange={handleCheckboxChange} 
                />
                <div className="checkbox-content">
                  <FaWheelchair className="icon" />
                  <span>Acessibilidade</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input 
                  type="checkbox" 
                  name="cozinha" 
                  checked={infraestrutura.cozinha} 
                  onChange={handleCheckboxChange} 
                />
                <div className="checkbox-content">
                  <FaUtensils className="icon" />
                  <span>Cozinha Comunitária</span>
                </div>
              </label>
            </div>
          </div>

          {/* Coluna da Direita: Upload do Fotão */}
          <div className="form-column-right">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Imagem do Abrigo</h3>
            
            <div className="upload-container">
              {imagem ? (
                <div className="image-preview">
                  <img src={imagem} alt="Preview do abrigo" />
                  <button type="button" onClick={() => setImagem(null)} className="btn-remove-image">Remover Foto</button>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  <FaUpload className="upload-icon" />
                  <p>Faça upload da imagem principal do abrigo</p>
                  <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                </label>
              )}
            </div>

            {/* Botões de Ação na base direita */}
            <div className="form-actions">
              <button type="submit" className="btn-action salvar">Salvar Alterações</button>
              <div className="danger-actions">
                <button type="button" className="btn-action excluir">Excluir Registro</button>
                <button type="button" onClick={() => navigate('/abrigo')} className="btn-action cancelar">Cancelar</button>
              </div>
            </div>
          </div>

        </form>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  );
}

