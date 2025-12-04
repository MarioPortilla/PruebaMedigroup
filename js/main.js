$(document).ready(function() {
    const COLUMNA_CATEGORIA = 1;
    const COLUMNA_FECHA = 3; 
    const API_BASE_URL = 'http://localhost:3306/api/medicamentos';
    const DATA_TABLES_LANG_URL = 'https://cdn.datatables.net/plug-ins/2.0.7/i18n/es-ES.json';
    let medicamentosCache = {};
    let tabla = $('#miTabla').DataTable({
        language: {
            url: DATA_TABLES_LANG_URL
        },
        order: [[COLUMNA_FECHA, 'asc']] 
    });

    cargarMedicamentos(tabla);

    function cargarMedicamentos(tablaInstancia) {
        
        $.ajax({
            url: API_BASE_URL,
            type: 'GET',
            dataType: 'json',
            
            success: function(response) {
                tablaInstancia.clear();

                medicamentosCache = {};
                const nuevosDatos = response.map(med => {
                    medicamentosCache[med.id] = med;

                    const fechaFormateada = formatearFecha(med.fecha_expiracion);

                    return [
                        med.nombre,
                        med.categoria,
                        med.cantidad,
                        fechaFormateada, 
                        `<button class="btn btn-sm btn-info btn-editar" 
                                data-id="${med.id}" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modalNuevoRegistro">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-eliminar" data-id="${med.id}"><i class="bi bi-trash"></i> Eliminar</button>`
                    ];
                });

                tablaInstancia.rows.add(nuevosDatos).draw();

                let categorias = tablaInstancia.column(COLUMNA_CATEGORIA).data().unique().sort();

                categorias.each(function(d) {
                    if (d) { 
                        $('#filtroCategoria').append(`<option value="${d}">${d}</option>`);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error al cargar los medicamentos desde la API.', status, error);
                $('#miTabla tbody').html(`
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            Error al cargar los datos: ${error}.
                        </td>
                    </tr>
                `);
            }
        });

         
    }

    // --- FILTRO POR CATEGORÍA ---

    $('#filtroCategoria').on('change', function() {
        let valorFiltro = $(this).val();
        
        tabla
            .column(COLUMNA_CATEGORIA)
            .search(valorFiltro ? '^' + valorFiltro + '$' : '', true, false)
            .draw();
    });

    // --- FILTRO POR FECHA ---

    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            let fechaFiltroStr = $('#filtroFecha').val();
            
            let fechaFilaStr = data[COLUMNA_FECHA];

            if (fechaFiltroStr === "") {
                return true;
            }

            let fechaFiltro = new Date(fechaFiltroStr);
            let fechaFila = new Date(fechaFilaStr);

            return fechaFila.getTime() <= fechaFiltro.getTime();
        }
    );

    $('#filtroFecha').on('change', function() {
        tabla.draw();
    });

    const formNuevoMedicamento = $('#formNuevoMedicamento')[0]; 
    const guardarBtn = $('#guardarMedicamentoBtn');
    const modalTitle = $('#modalNuevoRegistroLabel');
    let medicamentoEnEdicionId = null;

    function validarFechaCaducidad() {
        const fechaInput = $('#caducidadMedicamento');
        const fechaValor = new Date(fechaInput.val());
        const hoy = new Date();
        
        hoy.setHours(0, 0, 0, 0); 
        
        if (fechaInput.val() && fechaValor.getTime() <= hoy.getTime()) {
            fechaInput.addClass('is-invalid').removeClass('is-valid');
            fechaInput.next('.invalid-feedback').text('La fecha de caducidad debe ser futura.');
            return false;
        } else if (fechaInput.val()) {
            fechaInput.removeClass('is-invalid').addClass('is-valid');
            return true;
        }
        return false; 
    }


guardarBtn.on('click', function(event) {
    event.preventDefault();

    $('#caducidadMedicamento').removeClass('is-invalid is-valid');

    let bootstrapValid = formNuevoMedicamento.checkValidity();
    let fechaValida = validarFechaCaducidad();

    if (!bootstrapValid || !fechaValida) {
        formNuevoMedicamento.classList.add('was-validated'); 
        Swal.fire(
            'Error',
            'Validación fallida. Revise los campos requeridos.',
            'error'
        );
        return; 
    }

    const datosFormulario = {
        nombre: $('#nombreMedicamento').val(),
        categoria: $('#categoriaMedicamento').val(),
        cantidad: Number.parseInt($('#cantidadStock').val()), 
        fecha_expiracion: $('#caducidadMedicamento').val()
    };
    
    let urlAPI = API_BASE_URL;
    let tipoMetodo = 'POST';
    
    if (medicamentoEnEdicionId) {
        urlAPI = API_BASE_URL + '/' + medicamentoEnEdicionId; 
        tipoMetodo = 'PUT'; 
        console.log("Modo EDICIÓN. Enviando " + tipoMetodo + " a:", urlAPI);
    } else {
        console.log("Modo CREACIÓN. Enviando POST a:", urlAPI);
    }
    

    $.ajax({
        url: urlAPI, 
        type: tipoMetodo,
        contentType: 'application/json',
        data: JSON.stringify(datosFormulario),
        
        success: function(response) {

            const medicamentoResponse = response.medicamento || response.datos_actualizados; 
            const id = medicamentoResponse.id || response.id;
            const fechaFormateada = formatearFecha(medicamentoResponse.fecha_expiracion);
            console.log("response: ",response );
            
            const accionesHtml = `<button class="btn btn-sm btn-info btn-editar" 
                         data-id="${id}" data-bs-toggle="modal" 
                         data-bs-target="#modalNuevoRegistro">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger btn-eliminar" data-id="${id}"><i class="bi bi-trash"></i> Eliminar</button>`;

            const nuevaFila = [
                medicamentoResponse.nombre,          
                medicamentoResponse.categoria,       
                medicamentoResponse.cantidad,        
                fechaFormateada,                     
                accionesHtml
            ];

            const nuevaFilaEditar ={
                    id: Number.parseInt(id),
                    nombre: nuevaFila[0],
                    categoria: nuevaFila[1],
                    cantidad: nuevaFila[2],
                    fecha_expiracion: convertirFechaADateAPI(nuevaFila[3]),
                };

            if (tipoMetodo === 'POST') {
                console.log("nueva fila post: ",nuevaFila);
                
                tabla.row.add(nuevaFila).draw();
                medicamentosCache[id] = nuevaFilaEditar; 
                Swal.fire('¡Creado!', 'El medicamento ha sido creado con éxito.', 'success');
            } else {
                console.log("nueva fila put: ",nuevaFilaEditar);
                const filaAEditar = $('button.btn-editar[data-id="' + id + '"]').parents('tr');
                tabla.row(filaAEditar).data(nuevaFila).draw(false); 
                medicamentosCache[id] = nuevaFilaEditar;                
                Swal.fire('¡Actualizado!', 'Los cambios han sido guardados con éxito.', 'success');
            }
            
            formNuevoMedicamento.reset(); 
            formNuevoMedicamento.classList.remove('was-validated'); 
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalNuevoRegistro'));
            modalInstance.hide();
        },
        error: function(xhr, status, error) {
            console.error(tipoMetodo + " Error:", xhr.status, error);
            Swal.fire(
                'Error',
                'Ocurrió un error al guardar el registro. Revise la conexión a la API.',
                'error'
            );
        }
    });
});

    $('#modalNuevoRegistro').on('hidden.bs.modal', function () {
        formNuevoMedicamento.classList.remove('was-validated');
        $('#caducidadMedicamento').removeClass('is-invalid is-valid');
    });


    $('#modalNuevoRegistro').on('show.bs.modal', function (event) {
    const button = $(event.relatedTarget); 
    const isEditButton = button.hasClass('btn-editar'); 

    const formElement = $('#formNuevoMedicamento')[0];
    
    formElement.reset();
    formElement.classList.remove('was-validated'); 
    $('#caducidadMedicamento').removeClass('is-invalid is-valid'); 
    guardarBtn.removeClass('btn-warning btn-success'); 

    if (isEditButton) {
        medicamentoEnEdicionId = button.data('id');
        const datos = medicamentosCache[medicamentoEnEdicionId]; 
        
        modalTitle.text(`Editar Medicamento (${datos.nombre})`);
        guardarBtn.text('Guardar Cambios').addClass('btn-warning');
        
        if (datos) {
            console.log("medicamentosCache: ",medicamentosCache);
            
            $('#nombreMedicamento').val(datos.nombre);
            $('#categoriaMedicamento').val(datos.categoria);
            $('#cantidadStock').val(datos.cantidad);
            
            const fechaLimpia = datos.fecha_expiracion ? datos.fecha_expiracion.split('T')[0] : '';
            console.log("fechaLimpia: ",fechaLimpia);

            $('#caducidadMedicamento').val(fechaLimpia); 
        }

    } else {
        medicamentoEnEdicionId = null; 
        
        modalTitle.text('Registrar Nuevo Medicamento');
        guardarBtn.text('Guardar Registro').addClass('btn-success');
    }
});
    $('#miTabla tbody').on('click', '.btn-eliminar', function() {
        const row = $(this).parents('tr');
        
        const idRegistro = $(this).data('id');
        
        confirmarEliminacion(idRegistro, row);
    });
    function confirmarEliminacion(idRegistro, rowElement) {
        Swal.fire({
            title: "¿Estás seguro?",
            text: "¡El registro será eliminado y no podrás recuperarlo!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545", 
            cancelButtonColor: "#6c757d", 
            confirmButtonText: "Sí, ¡eliminar!",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
            eliminarRegistroAPI(idRegistro, rowElement)
            
            }
        });
    }

    function eliminarRegistroAPI(id, rowElement) {

        console.log(`[API] Iniciando eliminación para ID: ${id}`);
        
        $.ajax({
            url: API_BASE_URL + '/' + id, 
            type: 'DELETE',
            success: function(response) {
                Swal.fire(
                    '¡Eliminado!',
                    'El medicamento ha sido eliminado del inventario.',
                    'success'
                );
                
                tabla.row(rowElement).remove().draw(false); 
            },
            error: function(xhr, status, error) {
                console.error(`Error al eliminar ID ${id}:`, error);
                Swal.fire(
                    'Error',
                    'No se pudo completar la eliminación. Inténtalo de nuevo.',
                    'error'
                );
            }
        });
    }

});



function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    
    const partes = fechaStr.split('T')[0].split('-'); 
    
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]); 
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); 
    const anio = fecha.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
}

function convertirFechaADateAPI(fechaLocalStr) {
    if (!fechaLocalStr || typeof fechaLocalStr !== 'string') {
        return '';
    }

    const partes = fechaLocalStr.split('/'); 
    
    if (partes.length !== 3) {
        console.error("Formato de fecha local inválido. Se esperaba DD/MM/YYYY.");
        return '';
    }

    const dia = Number.parseInt(partes[0], 10);
    const mes = Number.parseInt(partes[1], 10);
    const anio = Number.parseInt(partes[2], 10);

    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

    return fechaUTC.toISOString();
}