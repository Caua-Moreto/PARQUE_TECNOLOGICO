import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AssetForm.css";
import LoadingIndicator from "../components/LoadingIndicator";
import toast from 'react-hot-toast';

function AssetForm() {
  const { categoryId, assetId } = useParams();
  const navigate = useNavigate();
  
  // 1. Estado para o Status (padrão 'disponivel')
  const [patrimonio, setPatrimonio] = useState("");
  const [status, setStatus] = useState("disponivel"); 
  
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [assetCategory, setAssetCategory] = useState(categoryId);

  const isEditing = assetId !== undefined;
  const pageTitle = isEditing ? 'Editar Ativo' : 'Registrar Novo Ativo';

  useEffect(() => {
    if (isEditing) {
      api.get(`/api/assets/${assetId}/`).then(res => {
        const asset = res.data;
        setPatrimonio(asset.patrimonio);
        
        // 2. IMPORTANTE: Carregar o status existente ao editar
        // Se o backend não retornar status, mantém o padrão.
        if (asset.status) {
            setStatus(asset.status);
        }

        const initialValues = {};
        asset.field_values.forEach(fv => {
          initialValues[fv.field_definition] = fv.value;
        });
        setFieldValues(initialValues);
        setAssetCategory(asset.category);
        fetchFieldDefinitions(asset.category);
      }).catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      fetchFieldDefinitions(categoryId);
    }
  }, [assetId, categoryId, isEditing]);

  const fetchFieldDefinitions = (catId) => {
    api.get(`/api/categories/${catId}/`)
      .then(res => {
        setFieldDefinitions(res.data.field_definitions);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar campos:", err);
        setIsLoading(false);
      });
  };

  const handleValueChange = (fieldDefId, value) => {
    setFieldValues(prev => ({ ...prev, [fieldDefId]: value }));
  };

  const handlePatrimonioChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPatrimonio(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading(`${isEditing ? 'Atualizando' : 'Salvando'} ativo...`);

    const payload = {
      patrimonio,
      status, // 3. IMPORTANTE: Enviar o status no payload
      category: assetCategory,
      field_values: Object.entries(fieldValues).map(([defId, val]) => ({
        field_definition: parseInt(defId),
        value: val
      }))
    };
    
    const request = isEditing
      ? api.put(`/api/assets/${assetId}/`, payload)
      : api.post("/api/assets/", payload);

    request.then(res => {
        toast.dismiss(loadingToast);
        if (res.status === 201 || res.status === 200) {
            toast.success(`Ativo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            navigate(`/category/${assetCategory}`);
        } else {
            toast.error("Ocorreu um erro.");
        }
    }).catch(err => {
        toast.dismiss(loadingToast);
        console.error(err);
        toast.error("Ocorreu um erro ao salvar o ativo.");
        setIsLoading(false);
    });
  };

  if (isLoading && !isEditing) return <LoadingIndicator />;

  return (
    <div className="asset-form-container">
      <h2>{pageTitle}</h2>
      {isLoading && isEditing ? (
        <LoadingIndicator />
      ) : (
        <form onSubmit={handleSubmit} className="asset-form">
          <div className="form-group">
            <label htmlFor="patrimonio">Patrimônio (Obrigatório)</label>
            <input
              id="patrimonio"
              className="form-input"
              type="text"
              value={patrimonio}
              onChange={handlePatrimonioChange}
              placeholder="Digite apenas números"
              pattern="[0-9]*"
              required
            />
          </div>

          {/* 4. Campo de Seleção de Status */}
          <div className="form-group">
            <label htmlFor="status">Situação do Ativo</label>
            <select
              id="status"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="disponivel">Disponível</option>
              <option value="em_uso">Em Uso</option>
              <option value="manutencao">Em Manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {fieldDefinitions.map((field) => (
            <div className="form-group" key={field.id}>
              <label htmlFor={`field-${field.id}`}>{field.name}</label>
              <input
                id={`field-${field.id}`}
                className="form-input"
                type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                value={fieldValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
              />
            </div>
          ))}

          <div className="form-actions">
            <button type="submit" className="form-button submit-button">
              {isEditing ? 'Atualizar Ativo' : 'Salvar Ativo'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="form-button cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AssetForm;